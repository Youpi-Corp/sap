use crate::schema::user;
use crate::schema::info;
use diesel::{Insertable, Queryable, Selectable};
use serde::{Deserialize, Serialize};

#[derive(Queryable, Selectable, Serialize, Deserialize)]
#[diesel(table_name = user)]
pub struct UserObject {
    pub id: i32,
    pub pseudo: Option<String>,
    pub email: Option<String>,
    pub password: Option<String>,
    pub role: Option<String>,
}

#[derive(Insertable, Serialize, Deserialize)]
#[diesel(table_name = user)]
pub struct NewUserObject {
    pub pseudo: Option<String>,
    pub email: Option<String>,
    pub password: Option<String>,
    pub role: Option<String>,
}

// Struct to represent an info
#[derive(Queryable, Selectable, Serialize, Deserialize)]
#[diesel(table_name = info)]
pub struct InfoObject {
    pub cgu: String,
    pub legal_mentions: Option<String>,
}
