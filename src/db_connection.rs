use crate::secret::get_secret;
use diesel::r2d2::{self, ConnectionManager}; // Import r2d2 and ConnectionManager
use diesel::PgConnection;

pub fn establish_connection() -> r2d2::Pool<ConnectionManager<PgConnection>> {
    let database_url = get_secret("DATABASE_URL").expect("DATABASE_URL must be set");
    let manager = ConnectionManager::<PgConnection>::new(database_url);

    r2d2::Pool::builder()
        .max_size(5) // Réduire la taille maximale du pool
        .min_idle(Some(1)) // Définir le minimum de connexions idle
        .build(manager)
        .expect("Failed to create pool.")
}
