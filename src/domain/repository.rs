use super::models::InfoObject;
use super::models::NewUserObject;
use crate::domain::models::UserObject;
use actix_web::HttpResponse;
use diesel::result::Error;

pub trait UserRepository {
    fn create_user(&mut self, new_user: NewUserObject) -> Result<UserObject, Error>;
    fn get_user_by_id(&mut self, user_id: i32) -> Result<UserObject, Error>;
    fn get_user_by_email(&mut self, email: &str) -> Result<UserObject, Error>;
    fn get_all_users(&mut self) -> Result<Vec<UserObject>, Error>;
    fn delete_user(&mut self, user_id: i32) -> Result<usize, Error>;
    fn update_user(&mut self, user: UserObject) -> Result<UserObject, Error>;
    fn login(&mut self, email: &str, password: &str) -> Result<HttpResponse, Error>;
}

pub trait InfoRepository {
    fn get_info(&mut self) -> Result<InfoObject, Error>;
}
