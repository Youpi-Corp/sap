use crate::domain::{
    models::{NewUserObject, UserObject},
    repository::UserRepository,
};
use diesel::{r2d2::{self, ConnectionManager}, RunQueryDsl, QueryDsl, ExpressionMethods};
use diesel::result::Error;
use diesel::PgConnection;

pub struct PostgresUserRepository<'a> {
    pub conn: &'a mut r2d2::PooledConnection<ConnectionManager<PgConnection>>,
}

impl<'a> UserRepository for PostgresUserRepository<'a> {
    fn create_user(&mut self, new_user: NewUserObject) -> Result<UserObject, Error> {
        use crate::schema::user::dsl::*;

        let result = diesel::insert_into(user)
            .values(&new_user)
            .returning((id, pseudo, email, password, role))
            .get_result::<UserObject>(self.conn);

        match result {
            Ok(user_object) => Ok(user_object),
            Err(e) => Err(e),
        }
    }

    fn get_user_by_id(&mut self, user_id: i32) -> Result<UserObject, Error> {
        use crate::schema::user::dsl::*;

        let result = user
            .filter(id.eq(user_id))
            .select((id, pseudo, email, password, role))
            .first::<UserObject>(self.conn);

        match result {
            Ok(user_object) => Ok(user_object),
            Err(e) => Err(e),
        }
    }

    fn get_all_users(&mut self) -> Result<Vec<UserObject>, Error> {
        use crate::schema::user::dsl::*;

        let result = user
            .select((id, pseudo, email, password, role))
            .load::<UserObject>(self.conn);

        match result {
            Ok(users) => Ok(users),
            Err(e) => Err(e),
        }
    }

    fn delete_user(&mut self, user_id: i32) -> Result<usize, Error> {
        use crate::schema::user::dsl::*;

        let result = diesel::delete(user.filter(id.eq(user_id)))
            .execute(self.conn);

        match result {
            Ok(count) => Ok(count),
            Err(e) => Err(e),
        }
    }

    fn update_user(&mut self, user_object: UserObject) -> Result<UserObject, Error> {
        use crate::schema::user::dsl::*;

        let result = diesel::update(user.filter(id.eq(user_object.id)))
            .set((
                pseudo.eq(user_object.pseudo.as_ref()),
                email.eq(user_object.email.as_ref()),
            ))
            .returning((id, pseudo, email, password, role))
            .get_result::<UserObject>(self.conn);

        match result {
            Ok(user_object) => Ok(user_object),
            Err(e) => Err(e),
        }
    }
}
