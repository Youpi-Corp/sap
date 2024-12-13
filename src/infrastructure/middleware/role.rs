use actix_web::{
    dev::{forward_ready, Service, ServiceRequest, ServiceResponse, Transform},
    Error, HttpMessage, HttpResponse,
};
use futures::future::LocalBoxFuture;
use futures::future::{ready, Ready};
use std::rc::Rc;

#[derive(Clone, Copy)]
pub enum Role {
    Learner = 0,
    Teacher = 1,
    Conceptor = 2,
    Admin = 3,
}

// Middleware pour vérifier les rôles
pub struct RoleGuard {
    required_roles: Rc<Vec<Role>>,
}

impl RoleGuard {
    pub fn new(roles: Vec<Role>) -> Self {
        RoleGuard {
            required_roles: Rc::new(roles),
        }
    }

    // Vérifie si le rôle binaire contient les permissions requises
    fn has_required_roles(user_role: &str, required_roles: &[Role]) -> bool {
        // the user role is a string representation of roles
        // the string should contain 4 characters, 0 or 1, each representing a role
        // 0 for no role, 1 for the role
        // the order of the roles is [Learner, Teacher, Conceptor, Admin]
        // e.g. "***1" means the user is an Admin

        // check if the user role is a valid binary string
        if user_role.len() != 4 || !user_role.chars().all(|c| c == '0' || c == '1') {
            return false;
        }

        // if the user role contains the admin role, it has all the permissions
        if user_role.chars().last().unwrap() == '1' {
            return true;
        }

        // check if the user role contains the required roles
        let mut authorized = false;
        for role in required_roles {
            if user_role.chars().nth(*role as usize).unwrap() == '1' {
                authorized = true;
                break;
            }
        }

        return authorized;
    }
}

pub struct RoleGuardMiddleware<S> {
    service: S,
    required_roles: Rc<Vec<Role>>,
}

impl<S> Transform<S, ServiceRequest> for RoleGuard
where
    S: Service<ServiceRequest, Response = ServiceResponse, Error = Error>,
    S::Future: 'static,
{
    type Response = ServiceResponse;
    type Error = Error;
    type Transform = RoleGuardMiddleware<S>;
    type InitError = ();
    type Future = Ready<Result<Self::Transform, Self::InitError>>;

    fn new_transform(&self, service: S) -> Self::Future {
        ready(Ok(RoleGuardMiddleware {
            service,
            required_roles: self.required_roles.clone(),
        }))
    }
}

impl<S> Service<ServiceRequest> for RoleGuardMiddleware<S>
where
    S: Service<ServiceRequest, Response = ServiceResponse, Error = Error>,
    S::Future: 'static,
{
    type Response = ServiceResponse;
    type Error = Error;
    type Future = LocalBoxFuture<'static, Result<Self::Response, Self::Error>>;

    forward_ready!(service);

    fn call(&self, req: ServiceRequest) -> Self::Future {
        let is_authorized =
            if let Some(claims) = req.extensions().get::<crate::domain::models::Claims>() {
                let user_role = &claims.role;
                RoleGuard::has_required_roles(user_role, &self.required_roles)
            } else {
                false
            };

        if is_authorized {
            let fut = self.service.call(req);
            Box::pin(async move {
                let res = fut.await?;
                Ok(res)
            })
        } else {
            let response = if req
                .extensions()
                .get::<crate::domain::models::Claims>()
                .is_some()
            {
                HttpResponse::Forbidden().json("Insufficient permissions")
            } else {
                HttpResponse::Unauthorized().json("No authentication token found")
            };
            Box::pin(std::future::ready(Ok(req.into_response(response))))
        }
    }
}
