mod application;
mod db_connection;
mod domain;
mod infrastructure;
mod routes;
mod schema;

use actix_web::{web, App, HttpServer};

#[actix_web::main]
async fn main() -> std::io::Result<()> {
    let pool = db_connection::establish_connection_pool(); // Create the connection pool

    HttpServer::new(move || {
        App::new()
            .app_data(web::Data::new(pool.clone())) // Pass the pool to the app
            .configure(routes::users::init) // Initialize user-related routes
                                            //.configure(routes::posts::init) // Initialize post-related routes
    })
    .bind("127.0.0.1:8080")?
    .run()
    .await
}
