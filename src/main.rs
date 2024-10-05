mod application;
mod db_connection;
mod domain;
mod infrastructure;
mod routes;
mod schema;

use actix_web::{middleware::Logger, web, App, HttpServer};
use env_logger::Env;

#[actix_web::main]
async fn main() -> std::io::Result<()> {
    // Initialize the logger with default log level set to `info`
    env_logger::init_from_env(Env::default().default_filter_or("info"));

    let pool = db_connection::establish_connection_pool(); // Create the connection pool

    HttpServer::new(move || {
        App::new()
            .wrap(Logger::default()) // Add the Logger middleware
            .app_data(web::Data::new(pool.clone())) // Pass the pool to the app
            .configure(routes::user::init) // Initialize user-related routes
            .configure(routes::info::init) // Initialize info-related routes
    })
    .bind("127.0.0.1:8080")?
    .run()
    .await
}
