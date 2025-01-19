use actix_web::{
    dev::{forward_ready, Service, ServiceRequest, ServiceResponse, Transform},
    Error, HttpMessage, HttpResponse,
};
use futures::future::LocalBoxFuture;
use futures::future::{ready, Ready};
use std::rc::Rc;

#[derive(Clone, Copy, Debug)]
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

// Modified Role Guard
impl RoleGuard {
    pub fn new(roles: Vec<Role>) -> Self {
        RoleGuard {
            required_roles: Rc::new(roles),
        }
    }

    fn has_required_roles(user_role: &str, required_roles: &[Role]) -> bool {
        println!("Checking roles - User role: {}", user_role); // Debug print

        // Validate role string format
        if user_role.len() != 4 || !user_role.chars().all(|c| c == '0' || c == '1') {
            println!("Invalid role format"); // Debug print
            return false;
        }

        // Admin check
        if user_role.chars().nth(3).unwrap() == '1' {
            println!("User is admin, access granted"); // Debug print
            return true;
        }

        // Check specific roles
        let authorized = required_roles.iter().any(|role| {
            let has_role = user_role.chars().nth(*role as usize).unwrap() == '1';
            println!("Checking role {:?}: {}", role, has_role); // Debug print
            has_role
        });

        println!("Final authorization result: {}", authorized); // Debug print
        authorized
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
                println!("User role: {}", claims.role); // Debug print
                let user_role = &claims.role;
                RoleGuard::has_required_roles(user_role, &self.required_roles)
            } else {
                println!("No claims found"); // Debug print
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
                HttpResponse::Unauthorized().json("Unauthorized")
            };
            Box::pin(std::future::ready(Ok(req.into_response(response))))
        }
    }
}
