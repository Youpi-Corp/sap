use crate::application::services::UserService;
use crate::domain::models::Claims;
use crate::domain::models::{NewUserObject, UserObject};
use crate::infrastructure::middleware::auth::AuthenticationGuard as AuthMiddleware;
use crate::infrastructure::middleware::auth::Role;
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
    get,
    path = "/user/get/{user_id}",
    responses(
        (status = 200, description = "User found successfully", body = UserObject),
        (status = 404, description = "User not found")
    ),
    params(
        ("user_id" = i32, Path, description = "User ID to fetch")
    ),
    security(
        ("bearerAuth" = [])
    ),
    tag = "Users"
)]
pub async fn get_user_by_id_handler(
    pool: web::Data<r2d2::Pool<ConnectionManager<PgConnection>>>,
    user_id: web::Path<i32>,
) -> impl Responder {
    with_user_service(&pool, |user_service| {
        match user_service.get_user_by_id(*user_id) {
            Ok(user) => Ok(HttpResponse::Ok().json(user)),
            Err(_) => Ok(HttpResponse::NotFound().json("User not found!")),
        }
    })
}

#[utoipa::path(
    post,
    path = "/user/create",
    request_body = NewUserObject,
    responses(
        (status = 200, description = "User created successfully", body = UserObject),
        (status = 500, description = "Failed to create user")
    ),
    security(
        ("bearerAuth" = [])
    ),
    tag = "Users"
)]
pub async fn create_user_handler(
    pool: web::Data<r2d2::Pool<ConnectionManager<PgConnection>>>,
    query: web::Json<NewUserObject>,
) -> impl Responder {
    with_user_service(&pool, |user_service| {
        match user_service.create_user(query.into_inner()) {
            Ok(user) => Ok(HttpResponse::Ok().json(user)),
            Err(_) => Ok(HttpResponse::InternalServerError().json("Failed to create user!")),
        }
    })
}

#[utoipa::path(
    get,
    path = "/user/list",
    responses(
        (status = 200, description = "List of users retrieved successfully", body = Vec<UserObject>),
        (status = 500, description = "Failed to retrieve users")
    ),
    security(
        ("bearerAuth" = [])
    ),
    tag = "Users"
)]
pub async fn list_users_handler(
    pool: web::Data<r2d2::Pool<ConnectionManager<PgConnection>>>,
) -> impl Responder {
    with_user_service(&pool, |user_service| match user_service.get_all_users() {
        Ok(users) => Ok(HttpResponse::Ok().json(users)),
        Err(_) => Ok(HttpResponse::InternalServerError().json("Failed to get users!")),
    })
}

#[utoipa::path(
    delete,
    path = "/user/delete/{user_id}",
    responses(
        (status = 200, description = "User deleted successfully"),
        (status = 500, description = "Failed to delete user")
    ),
    params(
        ("user_id" = i32, Path, description = "User ID to delete")
    ),
    security(
        ("bearerAuth" = [])
    ),
    tag = "Users"
)]
pub async fn delete_user_handler(
    pool: web::Data<r2d2::Pool<ConnectionManager<PgConnection>>>,
    user_id: web::Path<i32>,
) -> impl Responder {
    with_user_service(&pool, |user_service| {
        match user_service.delete_user(*user_id) {
            Ok(_) => Ok(HttpResponse::Ok().json("User deleted!")),
            Err(_) => Ok(HttpResponse::InternalServerError().json("Failed to delete user!")),
        }
    })
}

#[utoipa::path(
    put,
    path = "/user/update/{user_id}",
    request_body = NewUserObject,
    responses(
        (status = 200, description = "User updated successfully", body = UserObject),
        (status = 500, description = "Failed to update user")
    ),
    params(
        ("user_id" = i32, Path, description = "User ID to update")
    ),
    security(
        ("bearerAuth" = [])
    ),
    tag = "Users"
)]
pub async fn update_user_handler(
    pool: web::Data<r2d2::Pool<ConnectionManager<PgConnection>>>,
    user_id: web::Path<i32>,
    query: web::Json<NewUserObject>,
) -> impl Responder {
    with_user_service(&pool, |user_service| {
        let mut user_to_update = user_service.get_user_by_id(*user_id).unwrap();

        // Update the user with the new values if they are provided
        if let Some(pseudo) = &query.pseudo {
            user_to_update.pseudo = Some(pseudo.clone());
        }
        if let Some(email) = &query.email {
            user_to_update.email = Some(email.clone());
        }
        if let Some(password_hash) = &query.password_hash {
            user_to_update.password_hash = Some(password_hash.clone());
        }
        if let Some(role) = &query.role {
            user_to_update.role = Some(role.clone());
        }

        match user_service.update_user(user_to_update) {
            Ok(user) => Ok(HttpResponse::Ok().json(user)),
            Err(_) => Ok(HttpResponse::InternalServerError().json("Failed to update user!")),
        }
    })
}

#[utoipa::path(
    get,
    path = "/user/get_by_email/{email}",
    responses(
        (status = 200, description = "User found successfully", body = UserObject),
        (status = 404, description = "User not found")
    ),
    params(
        ("email" = String, Path, description = "Email to fetch")
    ),
    security(
        ("bearerAuth" = [])
    ),
    tag = "Users"
)]
pub async fn get_user_by_email_handler(
    pool: web::Data<r2d2::Pool<ConnectionManager<PgConnection>>>,
    email: web::Path<String>,
) -> impl Responder {
    with_user_service(&pool, |user_service| {
        match user_service.get_user_by_email(&email.into_inner()) {
            Ok(user) => Ok(HttpResponse::Ok().json(user)),
            Err(_) => Ok(HttpResponse::NotFound().json("User not found!")),
        }
    })
}

#[utoipa::path(
    get,
    path = "/user/get_email_used/{email}",
    responses(
        (status = 200, description = "Email already used", body = String),
        (status = 404, description = "Email not used")
    ),
    params(
        ("email" = String, Path, description = "Email to check")
    ),
    tag = "Users"
)]
pub async fn get_email_used_handler(
    pool: web::Data<r2d2::Pool<ConnectionManager<PgConnection>>>,
    email: web::Path<String>,
) -> impl Responder {
    with_user_service(&pool, |user_service| {
        match user_service.get_user_by_email(&email.into_inner()) {
            Ok(_) => Ok(HttpResponse::Ok().json("Email already used")),
            Err(_) => Ok(HttpResponse::NotFound().json("Email not used")),
        }
    })
}

#[utoipa::path(
    get,
    path = "/user/me",
    responses(
        (status = 200, description = "Current user found successfully", body = UserObject),
        (status = 404, description = "User not found")
    ),
    security(
        ("bearerAuth" = [])
    ),
    tag = "Users"
)]
pub async fn get_current_user_handler(
    pool: web::Data<r2d2::Pool<ConnectionManager<PgConnection>>>,
    claims: web::ReqData<Claims>,
) -> impl Responder {
    with_user_service(&pool, |user_service| {
        match user_service.get_user_by_email(&claims.sub) {
            Ok(user) => Ok(HttpResponse::Ok().json(user)),
            Err(_) => Ok(HttpResponse::NotFound().json("User not found!")),
        }
    })
}

pub fn init(cfg: &mut web::ServiceConfig) {
    cfg.service(
        web::resource("/create")
            .wrap(AuthMiddleware::with_roles(vec![Role::Admin]))
            .route(web::post().to(create_user_handler)),
    )
    .service(
        web::resource("/get/{user_id}")
            .wrap(AuthMiddleware::new())
            .route(web::get().to(get_user_by_id_handler)),
    )
    .service(
        web::resource("/get_by_email/{email}")
            .wrap(AuthMiddleware::new())
            .route(web::get().to(get_user_by_email_handler)),
    )
    .service(
        web::resource("/list")
            .wrap(AuthMiddleware::with_roles(vec![Role::Admin]))
            .route(web::get().to(list_users_handler)),
    )
    .service(
        web::resource("/delete/{user_id}")
            .wrap(AuthMiddleware::with_roles(vec![Role::Admin]))
            .route(web::delete().to(delete_user_handler)),
    )
    .service(
        web::resource("/update/{user_id}")
            .wrap(AuthMiddleware::new())
            .route(web::put().to(update_user_handler)),
    )
    .service(
        web::resource("/me")
            .wrap(AuthMiddleware::new())
            .route(web::get().to(get_current_user_handler)),
    )
    .route(
        "/get_email_used/{email}",
        web::get().to(get_email_used_handler),
    );
}
