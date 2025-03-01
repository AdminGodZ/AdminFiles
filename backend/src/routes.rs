use actix_files::NamedFile;
use actix_web::{
    get, post, delete, web, Error, HttpRequest, HttpResponse, Responder, Result,
};
use actix_multipart::Multipart;
use std::path::Path;

use crate::{
    auth::{get_current_user, login_user, register_user},
    config::Config,
    db::DbPool,
    errors::{AuthError, FileError},
    files::{delete_file, get_file_by_id, get_user_files, save_file},
    models::{CreateUserRequest, LoginRequest},
};

// Configure index routes
pub fn index_routes(cfg: &mut web::ServiceConfig) {
    cfg.service(index);
}

// Configure auth routes
pub fn auth_routes(cfg: &mut web::ServiceConfig) {
    cfg.service(
        web::scope("/api/auth")
            .service(register)
            .service(login)
            .service(me),
    );
}

// Configure file routes
pub fn file_routes(cfg: &mut web::ServiceConfig) {
    cfg.service(
        web::scope("/api/files")
            .service(upload_file)
            .service(list_files)
            .service(download_file)
            .service(remove_file),
    );
}

// Index endpoint - serves frontend files
#[get("/")]
async fn index() -> Result<impl Responder> {
    // In production, this would serve the bundled frontend files
    Ok(HttpResponse::Ok().body("AdminFiles API Server"))
}

// User registration endpoint
#[post("/register")]
async fn register(
    pool: web::Data<DbPool>,
    user_data: web::Json<CreateUserRequest>,
) -> Result<HttpResponse, AuthError> {
    let user = register_user(&pool, user_data.into_inner()).await?;
    Ok(HttpResponse::Created().json(user))
}

// User login endpoint
#[post("/login")]
async fn login(
    config: web::Data<Config>,
    pool: web::Data<DbPool>,
    login_data: web::Json<LoginRequest>,
) -> Result<HttpResponse, AuthError> {
    let response = login_user(&config, &pool, login_data.into_inner()).await?;
    Ok(HttpResponse::Ok().json(response))
}

// Get current user endpoint
#[get("/me")]
async fn me(
    req: HttpRequest,
    config: web::Data<Config>,
    pool: web::Data<DbPool>,
) -> Result<HttpResponse, AuthError> {
    let user = get_current_user(&req, &config, &pool).await?;
    Ok(HttpResponse::Ok().json(user))
}

// File upload endpoint
#[post("/upload")]
async fn upload_file(
    req: HttpRequest,
    config: web::Data<Config>,
    pool: web::Data<DbPool>,
    payload: Multipart,
) -> Result<HttpResponse, Error> {
    // Authenticate user
    let user = get_current_user(&req, &config, &pool)
        .await
        .map_err(|e| e)?;
    
    // Save uploaded file
    let file = save_file(&pool, user.id, payload)
        .await
        .map_err(|e| e)?;
        
    Ok(HttpResponse::Created().json(file))
}

// List files endpoint
#[get("")]
async fn list_files(
    req: HttpRequest,
    config: web::Data<Config>,
    pool: web::Data<DbPool>,
) -> Result<HttpResponse, Error> {
    // Authenticate user
    let user = get_current_user(&req, &config, &pool)
        .await
        .map_err(|e| e)?;
    
    // Get user's files
    let files = get_user_files(&pool, user.id)
        .await
        .map_err(|e| e)?;
        
    Ok(HttpResponse::Ok().json(files))
}

#[get("/{file_id}/download")]
async fn download_file(
    req: HttpRequest,
    config: web::Data<Config>,
    pool: web::Data<DbPool>,
    path: web::Path<i64>,
) -> Result<impl Responder, Error> {
    let file_id = path.into_inner();
    
    // Authenticate user
    let user = get_current_user(&req, &config, &pool)
        .await
        .map_err(|e| e)?;
    
    // Get file
    let file = get_file_by_id(&pool, file_id, user.id)
        .await
        .map_err(|e| e)?;
    
    // Send file
    let path = Path::new(&file.file_path);
    
    // Use content_disposition instead of with_filename
    use actix_web::http::header::{ContentDisposition, DispositionType};
    
    Ok(NamedFile::open(path)
        .map_err(|_| FileError::FileNotFound)?
        .set_content_disposition(ContentDisposition {
            disposition: DispositionType::Attachment,
            parameters: vec![],
        }))
}

// Delete file endpoint
#[delete("/{file_id}")]
async fn remove_file(
    req: HttpRequest,
    config: web::Data<Config>,
    pool: web::Data<DbPool>,
    path: web::Path<i64>,
) -> Result<HttpResponse, Error> {
    let file_id = path.into_inner();
    
    // Authenticate user
    let user = get_current_user(&req, &config, &pool)
        .await
        .map_err(|e| e)?;
    
    // Delete file
    delete_file(&pool, file_id, user.id)
        .await
        .map_err(|e| e)?;
        
    Ok(HttpResponse::NoContent().finish())
}
