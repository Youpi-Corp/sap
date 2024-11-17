use crate::application::services::UserService;
use crate::domain::models::LoginRequest;
use crate::infrastructure::persistence::user_repository::PostgresUserRepository;
use actix_web::{web, Error, HttpResponse, Responder};
use diesel::r2d2::{self, ConnectionManager};
use diesel::PgConnection;

fn with_user_service<F>(
    pool: &web::Data<r2d2::Pool<ConnectionManager<PgConnection>>>,
    f: F,
) -> Result<HttpResponse, Error>
where
    F: FnOnce(&mut UserService<PostgresUserRepository>) -> Result<HttpResponse, Error>,
{
    let mut conn = pool.get().map_err(|e| {
        actix_web::error::ErrorInternalServerError(format!(
            "Failed to get a connection from the pool: {}",
            e
        ))
    })?;
    let mut user_repo = PostgresUserRepository { conn: &mut conn };
    let mut user_service = UserService::new(&mut user_repo);
    f(&mut user_service)
}

#[utoipa::path(
    post,
    path = "/auth/login",
    request_body = LoginRequest,
    responses(
        (status = 200, description = "Login successful", body = String),
        (status = 401, description = "Invalid credentials")
    ),
    tags = ["Authentication"]
)]
pub async fn login_handler(
    pool: web::Data<r2d2::Pool<ConnectionManager<PgConnection>>>,
    login_request: web::Json<LoginRequest>,
) -> impl Responder {
    with_user_service(&pool, |user_service| {
        match user_service.login(&login_request.email, &login_request.password) {
            Ok(token) => Ok(HttpResponse::Ok().json(token)),
            Err(_) => Ok(HttpResponse::Unauthorized().json("Invalid credentials")),
        }
    })
}

// Register all auth-related routes
pub fn init(cfg: &mut web::ServiceConfig) {
    cfg.service(
        web::scope("/auth").route("/login", web::post().to(login_handler)), // POST /auth/login
    );
}