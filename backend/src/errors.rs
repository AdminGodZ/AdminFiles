use actix_web::{error::ResponseError, http::StatusCode, HttpResponse};
use serde::Serialize;
use std::fmt;
use thiserror::Error;

#[derive(Debug, Error)]
pub enum AuthError {
    #[error("Invalid credentials")]
    InvalidCredentials,
    
    #[error("User already exists")]
    UserAlreadyExists,
    
    #[error("User not found")]
    UserNotFound,
    
    #[error("Token is missing")]
    MissingToken,
    
    #[error("Invalid token")]
    InvalidToken,
    
    #[error("Unauthorized")]
    Unauthorized,
    
    #[error("Database error: {0}")]
    DatabaseError(#[from] sqlx::Error),
    
    #[error("Password hashing error: {0}")]
    BcryptError(#[from] bcrypt::BcryptError),
    
    #[error("JWT error: {0}")]
    JwtError(#[from] jsonwebtoken::errors::Error),
    
    #[error("Parse error: {0}")]
    ParseError(#[from] std::num::ParseIntError),
    
    #[error("Header conversion error: {0}")]
    HeaderError(#[from] actix_web::http::header::ToStrError),
}

#[derive(Debug, Error)]
pub enum FileError {
    #[error("File not found")]
    FileNotFound,
    
    #[error("Unauthorized access")]
    Unauthorized,
    
    #[error("Invalid file type")]
    InvalidFileType,
    
    #[error("File too large")]
    FileTooLarge,
    
    #[error("Database error: {0}")]
    DatabaseError(#[from] sqlx::Error),
    
    #[error("IO error: {0}")]
    IoError(#[from] std::io::Error),
    
    #[error("Multipart error: {0}")]
    MultipartError(String),
}

#[derive(Serialize)]
struct ErrorResponse {
    status: String,
    message: String,
}

impl ResponseError for AuthError {
    fn error_response(&self) -> HttpResponse {
        let status_code = match self {
            AuthError::InvalidCredentials => StatusCode::UNAUTHORIZED,
            AuthError::UserAlreadyExists => StatusCode::BAD_REQUEST,
            AuthError::UserNotFound => StatusCode::NOT_FOUND,
            AuthError::MissingToken => StatusCode::UNAUTHORIZED,
            AuthError::InvalidToken => StatusCode::UNAUTHORIZED,
            AuthError::Unauthorized => StatusCode::UNAUTHORIZED,
            _ => StatusCode::INTERNAL_SERVER_ERROR,
        };

        HttpResponse::build(status_code).json(ErrorResponse {
            status: status_code.to_string(),
            message: self.to_string(),
        })
    }

    fn status_code(&self) -> StatusCode {
        match self {
            AuthError::InvalidCredentials => StatusCode::UNAUTHORIZED,
            AuthError::UserAlreadyExists => StatusCode::BAD_REQUEST,
            AuthError::UserNotFound => StatusCode::NOT_FOUND,
            AuthError::MissingToken => StatusCode::UNAUTHORIZED,
            AuthError::InvalidToken => StatusCode::UNAUTHORIZED,
            AuthError::Unauthorized => StatusCode::UNAUTHORIZED,
            _ => StatusCode::INTERNAL_SERVER_ERROR,
        }
    }
}

impl ResponseError for FileError {
    fn error_response(&self) -> HttpResponse {
        let status_code = match self {
            FileError::FileNotFound => StatusCode::NOT_FOUND,
            FileError::Unauthorized => StatusCode::UNAUTHORIZED,
            FileError::InvalidFileType => StatusCode::BAD_REQUEST,
            FileError::FileTooLarge => StatusCode::PAYLOAD_TOO_LARGE,
            _ => StatusCode::INTERNAL_SERVER_ERROR,
        };

        HttpResponse::build(status_code).json(ErrorResponse {
            status: status_code.to_string(),
            message: self.to_string(),
        })
    }

    fn status_code(&self) -> StatusCode {
        match self {
            FileError::FileNotFound => StatusCode::NOT_FOUND,
            FileError::Unauthorized => StatusCode::UNAUTHORIZED,
            FileError::InvalidFileType => StatusCode::BAD_REQUEST,
            FileError::FileTooLarge => StatusCode::PAYLOAD_TOO_LARGE,
            _ => StatusCode::INTERNAL_SERVER_ERROR,
        }
    }
}
