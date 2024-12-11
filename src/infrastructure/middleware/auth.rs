use crate::domain::models::Claims;
use crate::secret::get_secret;
use actix_web::{
    dev::{forward_ready, Service, ServiceRequest, ServiceResponse, Transform},
    Error, HttpMessage, HttpResponse,
};
use futures::future::LocalBoxFuture;
use jsonwebtoken::{decode, DecodingKey, Validation};

pub struct AuthMiddleware;

impl<S> Transform<S, ServiceRequest> for AuthMiddleware
where
    S: Service<ServiceRequest, Response = ServiceResponse, Error = Error>,
    S::Future: 'static,
{
    type Response = ServiceResponse;
    type Error = Error;
    type Transform = AuthMiddlewareService<S>;
    type InitError = ();
    type Future = std::future::Ready<Result<Self::Transform, Self::InitError>>;

    fn new_transform(&self, service: S) -> Self::Future {
        std::future::ready(Ok(AuthMiddlewareService { service }))
    }
}

pub struct AuthMiddlewareService<S> {
    service: S,
}

impl<S> Service<ServiceRequest> for AuthMiddlewareService<S>
where
    S: Service<ServiceRequest, Response = ServiceResponse, Error = Error>,
    S::Future: 'static,
{
    type Response = ServiceResponse;
    type Error = Error;
    type Future = LocalBoxFuture<'static, Result<Self::Response, Self::Error>>;

    forward_ready!(service);

    fn call(&self, req: ServiceRequest) -> Self::Future {
        let auth_header = req.headers().get("Authorization");

        if let Some(auth_str) = auth_header {
            if let Ok(auth_token) = auth_str.to_str() {
                if auth_token.starts_with("Bearer ") {
                    let token = auth_token[7..].to_string();
                    let secret = get_secret("JWT_SECRET").expect("JWT_SECRET must be set");

                    match decode::<Claims>(
                        &token,
                        &DecodingKey::from_secret(secret.as_ref()),
                        &Validation::default(),
                    ) {
                        Ok(token_data) => {
                            req.extensions_mut().insert(token_data.claims);
                            return Box::pin(self.service.call(req));
                        }
                        Err(_) => {
                            return Box::pin(std::future::ready(Ok(req.into_response(
                                HttpResponse::Unauthorized().json("Invalid token"),
                            ))));
                        }
                    }
                }
            }
        }

        Box::pin(std::future::ready(Ok(req.into_response(
            HttpResponse::Unauthorized().json("Missing authorization token"),
        ))))
    }
}
