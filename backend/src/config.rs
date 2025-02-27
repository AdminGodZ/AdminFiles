use std::env;

#[derive(Clone, Debug)]
pub struct Config {
    pub database_url: String,
    pub jwt_secret: String,
    pub jwt_expires_in: String,
    pub jwt_max_age: i64,
    pub host: String,
    pub port: u16,
}

impl Config {
    pub fn from_env() -> Self {
        let database_url = env::var("DATABASE_URL").unwrap_or_else(|_| "sqlite:admin_files.db".to_string());
        
        let jwt_secret = env::var("JWT_SECRET").unwrap_or_else(|_| "your_super_secret_key_for_jwt_tokens".to_string());
        let jwt_expires_in = env::var("JWT_EXPIRED_IN").unwrap_or_else(|_| "60m".to_string());
        let jwt_max_age = env::var("JWT_MAX_AGE").unwrap_or_else(|_| "60".to_string()).parse::<i64>().unwrap_or(60);
        
        let host = env::var("HOST").unwrap_or_else(|_| "127.0.0.1".to_string());
        let port = env::var("PORT")
            .unwrap_or_else(|_| "8080".to_string())
            .parse::<u16>()
            .unwrap_or(8080);
            
        Self {
            database_url,
            jwt_secret,
            jwt_expires_in,
            jwt_max_age,
            host,
            port,
        }
    }
}
