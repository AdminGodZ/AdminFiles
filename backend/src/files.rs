use std::io::Write;
use std::path::Path;

use actix_multipart::Multipart;
use actix_web::web;
use futures_util::TryStreamExt;
use mime::Mime;
use uuid::Uuid;

use crate::db::DbPool;
use crate::errors::FileError;
use crate::models::{File, FileResponse};

// Maximum file size: 100MB
const MAX_FILE_SIZE: usize = 100 * 1024 * 1024;

// Save uploaded file to disk and database
pub async fn save_file(
    pool: &DbPool,
    user_id: i64,
    mut payload: Multipart,
) -> Result<FileResponse, FileError> {
    // Create uploads directory if it doesn't exist
    let uploads_dir = Path::new("uploads");
    if !uploads_dir.exists() {
        std::fs::create_dir_all(uploads_dir)?;
    }

    while let Some(mut field) = payload.try_next().await.map_err(|e| FileError::MultipartError(e.to_string()))? {
        // Extract field info
        let content_disposition = field.content_disposition();
        let original_filename = content_disposition
            .get_filename()
            .ok_or_else(|| FileError::MultipartError("No filename provided".to_string()))?
            .to_string();
            
        let content_type = field
            .content_type()
            .cloned()
            .unwrap_or(mime::APPLICATION_OCTET_STREAM);
            
        // Generate safe filename
        let file_ext = get_extension_from_filename(&original_filename);
        let filename = format!("{}{}", Uuid::new_v4(), file_ext);
        let filepath = format!("uploads/{}", &filename);
        
        // Open file for writing
        let mut file = std::fs::File::create(&filepath)?;
        let mut size: usize = 0;
        
        // Process file chunks
        while let Some(chunk) = field.try_next().await.map_err(|e| FileError::MultipartError(e.to_string()))? {
            // Check file size limit
            size += chunk.len();
            if size > MAX_FILE_SIZE {
                // Remove partially written file
                let _ = std::fs::remove_file(&filepath);
                return Err(FileError::FileTooLarge);
            }
            
            // Write chunk to file
            file.write_all(&chunk)?;
        }
        
        // Save file info to database
        let file_record = insert_file_record(
            pool,
            user_id,
            &filename,
            &original_filename,
            &content_type,
            size as i64,
            &filepath,
        )
        .await?;
        
        return Ok(file_record.into());
    }
    
    Err(FileError::MultipartError("No file uploaded".to_string()))
}

// Insert file record into database
async fn insert_file_record(
    pool: &DbPool,
    user_id: i64,
    filename: &str,
    original_filename: &str,
    content_type: &Mime,
    file_size: i64,
    file_path: &str,
) -> Result<File, FileError> {
    let file_type = content_type.to_string();
    
    let file = sqlx::query_as::<_, File>(
        r#"
        INSERT INTO files (user_id, filename, original_filename, file_type, file_size, file_path)
        VALUES (?, ?, ?, ?, ?, ?)
        RETURNING id, user_id, filename, original_filename, file_type, file_size, file_path, created_at
        "#,
    )
    .bind(user_id)
    .bind(filename)
    .bind(original_filename)
    .bind(file_type)
    .bind(file_size)
    .bind(file_path)
    .fetch_one(pool)
    .await?;
    
    Ok(file)
}

// Get list of files for a user
pub async fn get_user_files(pool: &DbPool, user_id: i64) -> Result<Vec<FileResponse>, FileError> {
    let files = sqlx::query_as::<_, File>(
        "SELECT * FROM files WHERE user_id = ? ORDER BY created_at DESC",
    )
    .bind(user_id)
    .fetch_all(pool)
    .await?;
    
    Ok(files.into_iter().map(|f| f.into()).collect())
}

// Get file by ID
pub async fn get_file_by_id(pool: &DbPool, file_id: i64, user_id: i64) -> Result<File, FileError> {
    let file = sqlx::query_as::<_, File>(
        "SELECT * FROM files WHERE id = ? AND user_id = ?",
    )
    .bind(file_id)
    .bind(user_id)
    .fetch_optional(pool)
    .await?
    .ok_or(FileError::FileNotFound)?;
    
    Ok(file)
}

// Delete file
pub async fn delete_file(pool: &DbPool, file_id: i64, user_id: i64) -> Result<(), FileError> {
    // Get file info
    let file = get_file_by_id(pool, file_id, user_id).await?;
    
    // Remove from database
    sqlx::query("DELETE FROM files WHERE id = ?")
        .bind(file_id)
        .execute(pool)
        .await?;
        
    // Delete actual file from disk
    let _ = std::fs::remove_file(file.file_path);
    
    Ok(())
}

// Helper function to extract file extension
fn get_extension_from_filename(filename: &str) -> String {
    Path::new(filename)
        .extension()
        .and_then(|ext| ext.to_str())
        .map(|ext| format!(".{}", ext))
        .unwrap_or_default()
}
