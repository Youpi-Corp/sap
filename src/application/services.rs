use crate::domain::models::User;
use crate::domain::repository::UserRepository;
use diesel::result::Error;

pub struct UserService<'a, T: UserRepository> {
    pub user_repo: &'a mut T, // Make this mutable
}

impl<'a, T: UserRepository> UserService<'a, T> {
    pub fn new(user_repo: &'a mut T) -> Self {
        UserService { user_repo }
    }

    pub fn get_user_by_id(&mut self, user_id: i32) -> Result<User, Error> {
        self.user_repo.get_user_by_id(user_id) // Mutably borrow user_repo
    }

    pub fn create_user(&mut self, name: &str, email: &str) -> Result<User, Error> {
        self.user_repo.create_user(name, email) // Mutably borrow user_repo
    }

    pub fn get_all_users(&mut self) -> Result<Vec<User>, Error> {
        self.user_repo.get_all_users() // Mutably borrow user_repo
    }

    pub fn delete_user(&mut self, user_id: i32) -> Result<usize, Error> {
        self.user_repo.delete_user(user_id) // Mutably borrow user_repo
    }

    pub fn update_user(&mut self, user : User) -> Result<User, Error> {
        self.user_repo.update_user(user) // Mutably borrow user_repo
    }
}
