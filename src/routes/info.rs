use crate::application::services::InfoService;
use crate::infrastructure::persistence::info_repository::PostgresInfoRepository;
use actix_web::{web, Error, HttpResponse, Responder};
use diesel::r2d2::{self, ConnectionManager};
use diesel::PgConnection;

fn with_info_service<F>(
    pool: &web::Data<r2d2::Pool<ConnectionManager<PgConnection>>>,
    f: F,
) -> Result<HttpResponse, Error>
where
    F: FnOnce(&mut InfoService<PostgresInfoRepository>) -> Result<HttpResponse, Error>,
{
    let mut conn = pool.get().map_err(|e| {
        actix_web::error::ErrorInternalServerError(format!(
            "Failed to get a connection from the pool: {}",
            e
        ))
    })?;

    let mut info_repo = PostgresInfoRepository { conn: &mut conn };
    let mut info_service = InfoService::new(&mut info_repo);

    f(&mut info_service)
}

pub async fn get_info_handler(
    pool: web::Data<r2d2::Pool<ConnectionManager<PgConnection>>>,
) -> impl Responder {
    with_info_service(&pool, |info_service| match info_service.get_info() {
        Ok(info) => Ok(HttpResponse::Ok().json(info)),
        Err(_) => Ok(HttpResponse::NotFound().json("Info not found!")),
    })
}

pub async fn alive_handler() -> impl Responder {
    HttpResponse::Ok().json("I'm alive!")
}

pub fn init(cfg: &mut web::ServiceConfig) {
    cfg.service(
        web::scope("/info")
            .route("/get", web::get().to(get_info_handler))
            .route("/alive", web::get().to(alive_handler)),
    );
}
