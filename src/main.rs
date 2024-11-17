mod application;
mod db_connection;
mod domain;
mod infrastructure;
mod routes;
mod schema;

use actix_web::{middleware::Logger, web, App, HttpServer};
use env_logger::Env;
use utoipa::OpenApi;
use utoipa_swagger_ui::SwaggerUi;

#[derive(OpenApi)]
#[openapi(
    paths(
        // Auth routes
        routes::auth::login_handler,
        // User routes
        routes::user::get_user_handler,
        routes::user::create_user_handler,
        routes::user::list_users_handler,
        routes::user::delete_user_handler,
        routes::user::update_user_handler
    ),
    components(
        schemas(
            crate::domain::models::LoginRequest,
            crate::domain::models::UserObject,
            crate::domain::models::NewUserObject
        )
    ),
    tags(
        (name = "Authentication", description = "Auth endpoints"),
        (name = "Users", description = "User management endpoints")
    )
)]
struct ApiDoc;

#[actix_web::main]
async fn main() -> std::io::Result<()> {
    // Initialize the logger with default log level set to `info`
    env_logger::init_from_env(Env::default().default_filter_or("info"));

    let pool = db_connection::establish_connection_pool(); // Create the connection pool

    let host = std::env::var("HOST").unwrap_or_else(|_| "0.0.0.0".to_string());
    let port = std::env::var("PORT").unwrap_or_else(|_| "8080".to_string());
    let bind_address = format!("{}:{}", host, port);

    HttpServer::new(move || {
        App::new()
            .wrap(Logger::default()) // Add the Logger middleware
            .app_data(web::Data::new(pool.clone())) // Pass the pool to the app
            .service(
                SwaggerUi::new("/swagger-ui/{_:.*}")
                    .url("/api-docs/openapi.json", ApiDoc::openapi()),
            ) // Add Swagger UI
            .configure(routes::user::init) // Initialize user-related routes
            .configure(routes::info::init) // Initialize info-related routes
            .configure(routes::auth::init) // Initialize auth-related routes
    })
    .bind(bind_address)?
    .run()
    .await
}
