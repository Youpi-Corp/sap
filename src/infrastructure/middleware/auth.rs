use crate::domain::models::Claims;
use actix_web::{
    dev::{forward_ready, Service, ServiceRequest, ServiceResponse, Transform},
    Error, HttpMessage, HttpResponse,
};
use futures::future::LocalBoxFuture;
use jsonwebtoken::{decode, DecodingKey, Validation};
use std::rc::Rc;

pub const COOKIE_NAME: &str = "auth_token";

#[derive(Clone, Copy, Debug)]
pub enum Role {
    Learner = 0,
    Teacher = 1,
    Conceptor = 2,
    Admin = 3,
}

pub struct AuthenticationGuard {
    required_roles: Option<Rc<Vec<Role>>>,
}

impl AuthenticationGuard {
    pub fn new() -> Self {
        AuthenticationGuard {
            required_roles: None,
        }
    }

    pub fn with_roles(roles: Vec<Role>) -> Self {
        AuthenticationGuard {
            required_roles: Some(Rc::new(roles)),
        }
    }
}

pub struct AuthenticationGuardMiddleware<S> {
    service: S,
    required_roles: Option<Rc<Vec<Role>>>,
}

impl<S> Transform<S, ServiceRequest> for AuthenticationGuard
where
    S: Service<ServiceRequest, Response = ServiceResponse, Error = Error>,
    S::Future: 'static,
{
    type Response = ServiceResponse;
    type Error = Error;
    type Transform = AuthenticationGuardMiddleware<S>;
    type InitError = ();
    type Future = std::future::Ready<Result<Self::Transform, Self::InitError>>;

    fn new_transform(&self, service: S) -> Self::Future {
        std::future::ready(Ok(AuthenticationGuardMiddleware {
            service,
            required_roles: self.required_roles.clone(),
        }))
    }
}

impl<S> Service<ServiceRequest> for AuthenticationGuardMiddleware<S>
where
    S: Service<ServiceRequest, Response = ServiceResponse, Error = Error>,
    S::Future: 'static,
{
    type Response = ServiceResponse;
    type Error = Error;
    type Future = LocalBoxFuture<'static, Result<Self::Response, Self::Error>>;

    forward_ready!(service);

    fn call(&self, req: ServiceRequest) -> Self::Future {
        println!("Starting authentication check");

        // First, handle authentication
        let auth_result = if let Some(cookie) = req.cookie("auth_token") {
            println!("Found auth cookie: {:?}", cookie);
            let token = cookie.value();
            let secret = crate::secret::get_secret("JWT_SECRET").expect("JWT_SECRET must be set");

            match decode::<Claims>(
                token,
                &DecodingKey::from_secret(secret.as_ref()),
                &Validation::default(),
            ) {
                Ok(token_data) => {
                    println!("Successfully decoded token: {:?}", token_data.claims);
                    req.extensions_mut().insert(token_data.claims.clone());
                    Ok(token_data.claims)
                }
                Err(e) => {
                    println!("Token decode error: {:?}", e);
                    Err(())
                }
            }
        } else {
            println!("No auth cookie found");
            Err(())
        };

        // Then, handle role checking if required
        match (auth_result, &self.required_roles) {
            (Ok(claims), Some(required_roles)) => {
                println!("Checking roles for user");
                let is_authorized = Self::has_required_roles(&claims.role, required_roles);
                println!("Authorization result: {}", is_authorized);

                if !is_authorized {
                    return Box::pin(std::future::ready(Ok(req.into_response(
                        HttpResponse::Forbidden().json("Insufficient permissions"),
                    ))));
                }
            }
            (Ok(_), None) => {
                println!("No role check required");
                // Authentication successful and no role check required
            }
            (Err(_), _) => {
                return Box::pin(std::future::ready(Ok(req.into_response(
                    HttpResponse::Unauthorized().json("Invalid or missing authentication token"),
                ))));
            }
        }

        let fut = self.service.call(req);
        Box::pin(async move {
            let res = fut.await?;
            Ok(res)
        })
    }
}

impl<S> AuthenticationGuardMiddleware<S> {
    fn has_required_roles(user_role: &str, required_roles: &[Role]) -> bool {
        println!("Checking roles - User role: {}", user_role);

        if user_role.len() != 4 || !user_role.chars().all(|c| c == '0' || c == '1') {
            return false;
        }

        // Admin check (position 3)
        if user_role.chars().nth(3).unwrap() == '1' {
            return true;
        }

        // Check specific roles
        required_roles
            .iter()
            .any(|role| user_role.chars().nth(*role as usize).unwrap() == '1')
    }
}
