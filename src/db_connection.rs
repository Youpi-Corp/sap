use diesel::r2d2::{self, ConnectionManager}; // Import r2d2 and ConnectionManager
use diesel::PgConnection;
use dotenvy::dotenv;
use std::env;

// Set up connection pool
pub fn establish_connection_pool() -> r2d2::Pool<ConnectionManager<PgConnection>> {
    dotenv().ok(); // Load environment variables from .env

    let database_url = env::var("DATABASE_URL").expect("DATABASE_URL must be set");

    let manager = ConnectionManager::<PgConnection>::new(database_url);
    r2d2::Pool::builder()
        .build(manager)
        .expect("Failed to create pool.")
}
