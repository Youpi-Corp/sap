use crate::domain::models::{InfoObject, NewUserObject, UserObject};
use crate::domain::repository::{InfoRepository, UserRepository};
use actix_web::HttpResponse;
use diesel::result::Error;

pub struct UserService<'a, T: UserRepository> {
    pub user_repo: &'a mut T, // Make this mutable
}

impl<'a, T: UserRepository> UserService<'a, T> {
    pub fn new(user_repo: &'a mut T) -> Self {
        UserService { user_repo }
    }

    pub fn get_user_by_id(&mut self, user_id: i32) -> Result<UserObject, Error> {
        self.user_repo.get_user_by_id(user_id) // Mutably borrow user_repo
    }

    pub fn get_user_by_email(&mut self, email: &str) -> Result<UserObject, Error> {
        self.user_repo.get_user_by_email(email) // Mutably borrow user_repo
    }

    pub fn create_user(&mut self, new_user: NewUserObject) -> Result<UserObject, Error> {
        self.user_repo.create_user(new_user) // Mutably borrow user_repo
    }

    pub fn get_all_users(&mut self) -> Result<Vec<UserObject>, Error> {
        self.user_repo.get_all_users() // Mutably borrow user_repo
    }

    pub fn delete_user(&mut self, user_id: i32) -> Result<usize, Error> {
        self.user_repo.delete_user(user_id) // Mutably borrow user_repo
    }

    pub fn update_user(&mut self, user: UserObject) -> Result<UserObject, Error> {
        self.user_repo.update_user(user) // Mutably borrow user_repo
    }
    pub fn login(&mut self, email: &str, password: &str) -> Result<HttpResponse, Error> {
        self.user_repo.login(email, password)
    }
}

pub struct InfoService<'a, T: InfoRepository> {
    pub info_repo: &'a mut T, // Make this mutable
}

impl<'a, T: InfoRepository> InfoService<'a, T> {
    pub fn new(info_repo: &'a mut T) -> Self {
        InfoService { info_repo }
    }

    pub fn get_info(&mut self) -> Result<InfoObject, Error> {
        self.info_repo.get_info() // Mutably borrow info_repo
    }
}
