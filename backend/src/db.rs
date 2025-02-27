use crate::config::Config;
use actix_web::web;
use sqlx::{Pool, Sqlite, SqlitePool};
use std::path::Path;

pub type DbPool = Pool<Sqlite>;
pub type DbError = sqlx::Error;

pub async fn create_db_pool(config: &Config) -> Result<web::Data<DbPool>, DbError> {
    let db_path = Path::new("admin_files.db");
    let db_exists = db_path.exists();
    
    let pool = SqlitePool::connect(&config.database_url).await?;
    
    // If database doesn't exist, run migrations
    if !db_exists {
        create_tables(&pool).await?;
    }
    
    Ok(web::Data::new(pool))
}

async fn create_tables(pool: &DbPool) -> Result<(), DbError> {
    // Create users table
    sqlx::query(
        r#"
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT NOT NULL UNIQUE,
            email TEXT NOT NULL UNIQUE,
            password TEXT NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
        "#,
    )
    .execute(pool)
    .await?;

    // Create files table
    sqlx::query(
        r#"
        CREATE TABLE IF NOT EXISTS files (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            filename TEXT NOT NULL,
            original_filename TEXT NOT NULL,
            file_type TEXT NOT NULL,
            file_size INTEGER NOT NULL,
            file_path TEXT NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
        )
        "#,
    )
    .execute(pool)
    .await?;

    Ok(())
}
