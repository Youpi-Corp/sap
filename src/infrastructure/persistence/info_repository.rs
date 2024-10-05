use crate::domain::{
    models::InfoObject,
    repository::InfoRepository,
};
use diesel::{r2d2::{self, ConnectionManager}, RunQueryDsl, QueryDsl};
use diesel::result::Error;
use diesel::PgConnection;

pub struct PostgresInfoRepository<'a> {
    pub conn: &'a mut r2d2::PooledConnection<ConnectionManager<PgConnection>>,
}

impl<'a> InfoRepository for PostgresInfoRepository<'a> {
    // returns the info object (there is only one row in the info table)
    fn get_info(&mut self) -> Result<InfoObject, Error> {
        use crate::schema::info::dsl::*;

        let result = info
            .select((cgu, legal_mentions))
            .first::<InfoObject>(self.conn);

        match result {
            Ok(info_object) => Ok(info_object),
            Err(e) => Err(e),
        }
    }
}
