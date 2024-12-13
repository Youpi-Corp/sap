use crate::domain::models::{Claims, TokenResponse};
use crate::secret::get_secret;
use chrono::{Duration, Utc};
use jsonwebtoken::{encode, EncodingKey, Header};
use rand::Rng;

//  ...existing code...
//    by John Smith
// 
//  Created:
//    <l3474PMle>
//  Last edited:
//    <l3474PMle>
//  Auto updated?
//    No
// 
//  Description:
//!   
// 
impl<'a, T: UserRepository> UserService<'a, T> {
    pub fn generate_tokens(&self, user_id: String) -> Result<TokenResponse, Error> {
        let secret = get_secret("JWT_SECRET").expect("JWT_SECRET must be set");

        // Access token expires in 15 minutes
        let expiration = Utc::now()
            .checked_add_signed(Duration::minutes(15))
            .unwrap()
            .timestamp();

        let claims = Claims {
            sub: user_id,
            exp: expiration,
            iat: Utc::now().timestamp(),
        };

        let token = encode(
            &Header::default(),
            &claims,
            &EncodingKey::from_secret(secret.as_ref()),
        )?;

        // Generate random refresh token
        let refresh_token = generate_refresh_token();

        // Store refresh token in database with user association
        self.repository
            .store_refresh_token(&claims.sub, &refresh_token)?;

        Ok(TokenResponse {
            access_token: token,
            refresh_token,
            token_type: "Bearer".to_string(),
            expires_in: expiration - Utc::now().timestamp(),
        })
    }

    pub fn refresh_token(&self, refresh_token: &str) -> Result<TokenResponse, Error> {
        let user_id = self.repository.verify_refresh_token(refresh_token)?;
        self.generate_tokens(user_id)
    }
}

fn generate_refresh_token() -> String {
    let mut rng = rand::thread_rng();
    let token: String = std::iter::repeat_with(|| rng.sample(rand::distributions::Alphanumeric))
        .take(32)
        .map(char::from)
        .collect();
    token
}
