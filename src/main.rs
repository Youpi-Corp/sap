mod application;
mod db_connection;
mod domain;
mod infrastructure;
mod routes;
mod schema;
mod secret;

use actix_web::{web, web::Data, web::ServiceConfig};
use secret::initialize_secrets;
use shuttle_actix_web::ShuttleActixWeb;
use shuttle_runtime::SecretStore;
use utoipa::OpenApi;
use utoipa_swagger_ui::SwaggerUi;

use utoipa::openapi::security::{HttpAuthScheme, HttpBuilder, SecurityScheme};
use utoipa::Modify;

struct SecurityAddon;

impl Modify for SecurityAddon {
    fn modify(&self, openapi: &mut utoipa::openapi::OpenApi) {
        // Ajouter le schéma de sécurité Bearer
        if let Some(components) = &mut openapi.components {
            components.security_schemes.insert(
                "bearerAuth".to_string(),
                SecurityScheme::Http(
                    HttpBuilder::new()
                        .scheme(HttpAuthScheme::Bearer)
                        .bearer_format("JWT")
                        .build(),
                ),
            );
        }
    }
}

#[derive(OpenApi)]
#[openapi(
    paths(
        // Auth routes
        routes::auth::login_handler,
        routes::auth::register_handler,
        // User routes
        routes::user::get_user_by_id_handler,
        routes::user::get_user_by_email_handler,
        routes::user::get_email_used_handler,
        routes::user::create_user_handler,
        routes::user::list_users_handler,
        routes::user::delete_user_handler,
        routes::user::update_user_handler,
        // Info routes
        routes::info::get_info_handler,
        routes::info::alive_handler
    ),
    components(
        schemas(
            crate::domain::models::LoginRequest,
            crate::domain::models::UserObject,
            crate::domain::models::NewUserObject,
            crate::domain::models::InfoObject
        )
    ),
    modifiers(&SecurityAddon),
    tags(
        (name = "Authentication", description = "Auth endpoints"),
        (name = "Users", description = "User management endpoints"),
        (name = "Info", description = "Info endpoints")
    )
)]
struct ApiDoc;

#[shuttle_runtime::main]
async fn main(
    #[shuttle_runtime::Secrets] secrets: SecretStore,
) -> ShuttleActixWeb<impl FnOnce(&mut ServiceConfig) + Send + Clone + 'static> {
    initialize_secrets(secrets.clone());

    let pool = db_connection::establish_connection();

    let config = move |cfg: &mut ServiceConfig| {
        cfg.app_data(Data::new(pool.clone()))
            // Fix: Remove the newline in the URL string and add Swagger UI before the routes
            .service(
                SwaggerUi::new("/swagger-ui/{_:.*}")
                    .url("/api-docs/openapi.json", ApiDoc::openapi()),
            )
            .service(web::scope("/auth").configure(routes::auth::init))
            .service(web::scope("/user").configure(routes::user::init))
            .service(web::scope("/info").configure(routes::info::init));
    };

    Ok(config.into())
}
