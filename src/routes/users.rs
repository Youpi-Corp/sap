use crate::application::services::UserService;
use crate::infrastructure::persistence::user_repository::PostgresUserRepository;
use crate::domain::models::NewUser;
use actix_web::{web, Responder, HttpResponse, Error};
use diesel::r2d2::{self, ConnectionManager};
use diesel::PgConnection;

// Helper function to handle common setup
fn with_user_service<F>(
    pool: &web::Data<r2d2::Pool<ConnectionManager<PgConnection>>>,
    f: F,
) -> Result<HttpResponse, Error>
where
    F: FnOnce(&mut UserService<PostgresUserRepository>) -> Result<HttpResponse, Error>,
{
    let mut conn = pool
        .get()
        .map_err(|e| {
            actix_web::error::ErrorInternalServerError(format!(
                "Failed to get a connection from the pool: {}",
                e
            ))
        })?;

    let mut user_repo = PostgresUserRepository { conn: &mut conn };
    let mut user_service = UserService::new(&mut user_repo);

    f(&mut user_service)
}

pub async fn get_user_handler(
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

pub async fn add_user_handler(
    pool: web::Data<r2d2::Pool<ConnectionManager<PgConnection>>>,
    query: web::Json<NewUser>,
) -> impl Responder {
    with_user_service(&pool, |user_service| {
        match user_service.create_user(&query.name, &query.email) {
            Ok(user) => Ok(HttpResponse::Ok().json(user)),
            Err(_) => Ok(HttpResponse::InternalServerError().json("Failed to create user!")),
        }
    })
}

pub async fn list_users_handler(
    pool: web::Data<r2d2::Pool<ConnectionManager<PgConnection>>>,
) -> impl Responder {
    with_user_service(&pool, |user_service| {
        match user_service.get_all_users() {
            Ok(users) => Ok(HttpResponse::Ok().json(users)),
            Err(_) => Ok(HttpResponse::InternalServerError().json("Failed to get users!")),
        }
    })
}

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

pub async fn update_user_handler(
    pool: web::Data<r2d2::Pool<ConnectionManager<PgConnection>>>,
    user_id: web::Path<i32>,
    query: web::Json<NewUser>,
) -> impl Responder {
    with_user_service(&pool, |user_service| {

        let mut user_to_update = user_service.get_user_by_id(*user_id).unwrap();
        user_to_update.name = query.name.clone();
        user_to_update.email = query.email.clone();

        match user_service.update_user(user_to_update) {
            Ok(user) => Ok(HttpResponse::Ok().json(user)),
            Err(_) => Ok(HttpResponse::InternalServerError().json("Failed to update user!")),
        }
    })
}

// Register all user-related routes
pub fn init(cfg: &mut web::ServiceConfig) {
    cfg.service(
        web::scope("/user")
        .route("/create", web::post().to(add_user_handler)) // POST /user/create
        .route("/get/{user_id}", web::get().to(get_user_handler)) // GET /user/get
        .route("/list", web::get().to(list_users_handler)) // GET /user/list
        .route("/delete/{user_id}", web::delete().to(delete_user_handler)) // DELETE /user/delete
        .route("/update/{user_id}", web::put().to(update_user_handler)), // PUT /user/update

        //.route("/login", web::post().to(login_user_handler)) // POST /user/login
        //.route("/logout", web::post().to(logout_user_handler)) // POST /user/logout
        //.route("/forgot-password", web::post().to(forgot_password_handler)) // POST /user/forgot-password
        //.route("/reset-password", web::post().to(reset_password_handler)) // POST /user/reset-password
        //.route("/report", web::get().to(report_user_handler)) // GET /user/report

        
        // sub-scope for role related routes
        //.service(
        //    web::scope("/role")
        //        .route("/get", web::get().to(get_user_role_handler)) // GET /user/role/get
        //        .route("/set", web::post().to(set_user_role_handler)), // POST /user/role/set
    );
}