use crate::{
    config::Config,
    db::DbPool,
    errors::AuthError,
    models::{CreateUserRequest, LoginRequest, LoginResponse, User, UserResponse},
};
use actix_web::{web, HttpMessage, HttpRequest};
use bcrypt::{hash, verify, DEFAULT_COST};
use chrono::{Duration, Utc};
use jsonwebtoken::{decode, encode, DecodingKey, EncodingKey, Header, Validation};
use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize)]
pub struct TokenClaims {
    pub sub: String,
    pub exp: usize,
    pub iat: usize,
}

pub async fn register_user(
    pool: &DbPool,
    user_data: CreateUserRequest,
) -> Result<UserResponse, AuthError> {
    // Check if user already exists
    let existing_user = sqlx::query_as::<_, User>(
        "SELECT * FROM users WHERE email = ? OR username = ?",
    )
    .bind(&user_data.email)
    .bind(&user_data.username)
    .fetch_optional(pool)
    .await?;

    if existing_user.is_some() {
        return Err(AuthError::UserAlreadyExists);
    }

    // Hash password
    let hashed_password = hash(user_data.password, DEFAULT_COST)?;

    // Insert new user
    let user_id = sqlx::query(
        "INSERT INTO users (username, email, password) VALUES (?, ?, ?)",
    )
    .bind(&user_data.username)
    .bind(&user_data.email)
    .bind(&hashed_password)
    .execute(pool)
    .await?
    .last_insert_rowid();

    // Get created user
    let user = sqlx::query_as::<_, User>("SELECT * FROM users WHERE id = ?")
        .bind(user_id)
        .fetch_one(pool)
        .await?;

    Ok(user.into())
}

pub async fn login_user(
    config: &Config,
    pool: &DbPool,
    login_data: LoginRequest,
) -> Result<LoginResponse, AuthError> {
    // Find user by email
    let user = sqlx::query_as::<_, User>("SELECT * FROM users WHERE email = ?")
        .bind(&login_data.email)
        .fetch_optional(pool)
        .await?
        .ok_or(AuthError::InvalidCredentials)?;

    // Verify password
    if !verify(login_data.password, &user.password)? {
        return Err(AuthError::InvalidCredentials);
    }

    // Generate JWT token
    let now = Utc::now();
    let iat = now.timestamp() as usize;
    let exp = (now + Duration::minutes(config.jwt_max_age)).timestamp() as usize;
    let claims = TokenClaims {
        sub: user.id.to_string(),
        exp,
        iat,
    };

    let token = encode(
        &Header::default(),
        &claims,
        &EncodingKey::from_secret(config.jwt_secret.as_bytes()),
    )?;

    Ok(LoginResponse {
        token,
        user: user.into(),
    })
}

pub fn verify_token(config: &Config, token: &str) -> Result<TokenClaims, AuthError> {
    let claims = decode::<TokenClaims>(
        token,
        &DecodingKey::from_secret(config.jwt_secret.as_bytes()),
        &Validation::default(),
    )?
    .claims;

    Ok(claims)
}

pub async fn get_current_user(
    req: &HttpRequest,
    config: &Config,
    pool: &DbPool,
) -> Result<User, AuthError> {
    let token = extract_token(req)?;
    let claims = verify_token(config, &token)?;
    let user_id = claims.sub.parse::<i64>()?;

    let user = sqlx::query_as::<_, User>("SELECT * FROM users WHERE id = ?")
        .bind(user_id)
        .fetch_optional(pool)
        .await?
        .ok_or(AuthError::UserNotFound)?;

    Ok(user)
}

fn extract_token(req: &HttpRequest) -> Result<String, AuthError> {
    let auth_header = req
        .headers()
        .get("Authorization")
        .ok_or(AuthError::MissingToken)?
        .to_str()?;

    if !auth_header.starts_with("Bearer ") {
        return Err(AuthError::InvalidToken);
    }

    Ok(auth_header[7..].to_string())
}

// Middleware for authenticated routes
pub struct AuthMiddleware {
    pub config: Config,
}

impl AuthMiddleware {
    pub fn new(config: Config) -> Self {
        Self { config }
    }
}
