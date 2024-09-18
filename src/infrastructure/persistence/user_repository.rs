use crate::domain::{
    models::{NewUser, User},
    repository::UserRepository,
};
use diesel::prelude::*;
use diesel::r2d2::{self, ConnectionManager}; // Import r2d2
use diesel::result::Error;
use diesel::PgConnection;

pub struct PostgresUserRepository<'a> {
    pub conn: &'a mut r2d2::PooledConnection<ConnectionManager<PgConnection>>, // Update to use r2d2 connection
}

impl<'a> UserRepository for PostgresUserRepository<'a> {
    fn create_user(&mut self, var_name: &str, var_email: &str) -> Result<User, Error> {
        use crate::schema::users::dsl::*;

        let new_user = NewUser {
            name: var_name,
            email: var_email,
        };

        diesel::insert_into(users)
            .values(&new_user)
            .get_result(self.conn)
    }

    fn get_user_by_id(&mut self, user_id: i32) -> Result<User, Error> {
        use crate::schema::users::dsl::*;

        users.filter(id.eq(user_id)).first::<User>(self.conn)
    }

    fn get_all_users(&mut self) -> Result<Vec<User>, Error> {
        use crate::schema::users::dsl::*;

        users.load::<User>(self.conn)
    }
}
