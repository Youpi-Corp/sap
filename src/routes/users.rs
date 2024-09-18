use crate::application::services::UserService;
use crate::infrastructure::persistence::user_repository::PostgresUserRepository;
use actix_web::{web, Responder};
use diesel::r2d2::{self, ConnectionManager};
use diesel::PgConnection;
use serde::Deserialize;

#[derive(Deserialize)]
pub struct CreateUserQuery {
    name: String,
    email: String,
}

// The route handler now takes a Data<Pool<ConnectionManager<PgConnection>>> argument
pub async fn get_user_handler(
    pool: web::Data<r2d2::Pool<ConnectionManager<PgConnection>>>,
) -> impl Responder {
    let mut conn = pool
        .get()
        .expect("Failed to get a connection from the pool");

    let mut user_repo = PostgresUserRepository { conn: &mut conn }; // Use the connection from the pool
    let mut user_service = UserService::new(&mut user_repo); // Pass user_repo as mutable

    match user_service.get_user_by_id(1) {
        Ok(user) => format!("Hello, {}! Your email is: {}", user.name, user.email),
        Err(_) => format!("User not found!"),
    }
}

// add user route (with name and email as query parameters)
pub async fn add_user_handler(
    pool: web::Data<r2d2::Pool<ConnectionManager<PgConnection>>>,
    web::Query(info): web::Query<CreateUserQuery>, // Use the struct instead of tuple
) -> impl Responder {
    let mut conn = pool
        .get()
        .expect("Failed to get a connection from the pool");

    let mut user_repo = PostgresUserRepository { conn: &mut conn }; // Use the connection from the pool
    let mut user_service = UserService::new(&mut user_repo); // Pass user_repo as mutable

    match user_service.create_user(&info.name, &info.email) {
        // Use named fields
        Ok(user) => format!("User {} created with id: {}", user.name, user.id),
        Err(_) => format!("Failed to create user!"),
    }
}

// get all users route
pub async fn get_all_users_handler(
    pool: web::Data<r2d2::Pool<ConnectionManager<PgConnection>>>,
) -> impl Responder {
    let mut conn = pool
        .get()
        .expect("Failed to get a connection from the pool");

    let mut user_repo = PostgresUserRepository { conn: &mut conn }; // Use the connection from the pool
    let mut user_service = UserService::new(&mut user_repo); // Pass user_repo as mutable

    match user_service.get_all_users() {
        Ok(users) => {
            let mut response = String::from("All users:\n");
            for user in users {
                response.push_str(&format!("{}: {}\n", user.id, user.name));
            }
            response
        }
        Err(_) => format!("Failed to get users!"),
    }
}

// Register all user-related routes
pub fn init(cfg: &mut web::ServiceConfig) {
    cfg.service(
        web::scope("/users")
            .route("/get", web::get().to(get_user_handler)) // GET /users/get
            .route("/create", web::post().to(add_user_handler)) // POST /users/create
            .route("/all", web::get().to(get_all_users_handler)), // GET /users/all
    );
}
