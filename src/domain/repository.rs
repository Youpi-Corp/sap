use crate::domain::models::User;
use diesel::result::Error;

pub trait UserRepository {
    fn create_user(&mut self, name: &str, email: &str) -> Result<User, Error>;
    fn get_user_by_id(&mut self, user_id: i32) -> Result<User, Error>;
    fn get_all_users(&mut self) -> Result<Vec<User>, Error>;
    fn delete_user(&mut self, user_id: i32) -> Result<usize, Error>;
    fn update_user(&mut self, user : User) -> Result<User, Error>;
}
