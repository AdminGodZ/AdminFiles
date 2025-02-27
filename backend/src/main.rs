mod auth;
mod config;
mod db;
mod errors;
mod files;
mod models;
mod routes;

use actix_cors::Cors;
use actix_web::{middleware::Logger, App, HttpServer};
use config::Config;
use db::create_db_pool;
use dotenv::dotenv;
use routes::{auth_routes, file_routes, index_routes};
use std::path::Path;

#[actix_web::main]
async fn main() -> std::io::Result<()> {
    dotenv().ok();
    env_logger::init();
    
    let config = Config::from_env();
    let db_pool = create_db_pool(&config).await.expect("Failed to create database pool");
    
    // Ensure uploads directory exists
    let uploads_dir = Path::new("uploads");
    if !uploads_dir.exists() {
        std::fs::create_dir_all(uploads_dir)?;
    }
    
    println!("Starting server at http://{}:{}", config.host, config.port);
    
    HttpServer::new(move || {
        let cors = Cors::default()
            .allow_any_origin()
            .allow_any_method()
            .allow_any_header()
            .max_age(3600);
            
        App::new()
            .wrap(cors)
            .wrap(Logger::default())
            .app_data(db_pool.clone())
            .configure(index_routes)
            .configure(auth_routes)
            .configure(file_routes)
    })
    .bind((config.host.clone(), config.port))?
    .run()
    .await
}
