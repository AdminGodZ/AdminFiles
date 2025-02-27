FROM rust:1.71 as builder

WORKDIR /app
COPY . .

RUN cargo build --release

FROM debian:bullseye-slim

WORKDIR /app

# Install required dependencies for SSL and other system libraries
RUN apt-get update && apt-get install -y \
    libssl-dev \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

# Copy the binary from the builder stage
COPY --from=builder /app/target/release/admin_files_backend /app/admin_files_backend

# Create uploads directory
RUN mkdir -p /app/uploads

# Run as non-root user for better security
RUN groupadd -r adminfiles && useradd -r -g adminfiles adminfiles
RUN chown -R adminfiles:adminfiles /app
USER adminfiles

# Expose port
EXPOSE 8080

# Run the binary
CMD ["/app/admin_files_backend"]
