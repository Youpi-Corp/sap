use crate::schema::info;
use crate::schema::user;
use diesel::{Insertable, Queryable, Selectable};
use serde::{Deserialize, Serialize};
use utoipa::ToSchema;

#[derive(Queryable, Selectable, Serialize, Deserialize, ToSchema)]
#[diesel(table_name = user)]
pub struct UserObject {
    #[schema(example = "1")]
    pub id: i32,
    #[schema(example = "user123")]
    pub pseudo: Option<String>,
    #[schema(example = "user@example.com")]
    pub email: Option<String>,
    #[schema(example = "sd8a1è9848é988ç_5651ahha_hài&çijsà:/çéje&")]
    pub password_hash: Option<String>,
    #[schema(example = "1000")]
    pub role: Option<String>,
}

#[derive(Insertable, Serialize, Deserialize, ToSchema)]
#[diesel(table_name = user)]
pub struct NewUserObject {
    #[schema(example = "user123")]
    pub pseudo: Option<String>,
    #[schema(example = "user@example.com")]
    pub email: Option<String>,
    #[schema(example = "sd8a1è9848é988ç_5651ahha_hài&çijsà:/çéje&")]
    pub password_hash: Option<String>,
    #[schema(example = "1000")]
    pub role: Option<String>,
}

// Struct to represent an info
#[derive(Queryable, Selectable, Serialize, Deserialize, ToSchema)]
#[diesel(table_name = info)]
pub struct InfoObject {
    #[schema(example = "blalalalala")]
    pub cgu: String,
    #[schema(example = "blbalblbalbalabla")]
    pub legal_mentions: Option<String>,
}

// Struct to represent a login request
#[derive(Deserialize, Serialize, ToSchema)]
pub struct LoginRequest {
    #[schema(example = "user@example.com")]
    pub email: String,
    #[schema(example = "password123")]
    pub password: String,
}

#[derive(Serialize, Deserialize)]
pub struct Claims {
    pub sub: String,
    pub exp: usize,
    pub role: String,
}
