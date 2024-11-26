mod application;
mod db_connection;
mod domain;
mod infrastructure;
mod routes;
mod schema;
mod secret;

use actix_web::{web::Data, web::ServiceConfig};
use secret::initialize_secrets;
use shuttle_actix_web::ShuttleActixWeb;
use shuttle_runtime::SecretStore;
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

#[shuttle_runtime::main]
async fn main(
    #[shuttle_runtime::Secrets] secrets: SecretStore,
) -> ShuttleActixWeb<impl FnOnce(&mut ServiceConfig) + Send + Clone + 'static> {
    initialize_secrets(secrets.clone());

    let pool = db_connection::establish_connection(); // Create the connection pool

    let config = move |cfg: &mut ServiceConfig| {
        cfg.app_data(Data::new(pool.clone())) // Pass the pool to the app
            .service(SwaggerUi::new("/swagger-ui/{_:.*}").url(
                "/api-docs/openapi.json
                    ",
                ApiDoc::openapi(),
            )) // Add Swagger UI
            .configure(routes::user::init) // Initialize user-related routes
            .configure(routes::info::init) // Initialize info-related routes
            .configure(routes::auth::init); // Initialize auth-related routes
    };

    Ok(config.into())
}
