# HTTPS Configuration for Gmail Viewer Backend

This guide explains how to configure the backend server to run with HTTPS instead of HTTP.

## Quick Setup

1. **Set Environment Variable**
   ```bash
   # In your .env file
   USE_HTTPS=true
   ```

2. **Generate SSL Certificates**
   
   **Option A: Using PowerShell (Recommended for Windows)**
   ```powershell
   .\generate-certs.ps1
   ```
   
   **Option B: Using Batch File**
   ```cmd
   generate-certs.bat
   ```
   
   **Option C: Manual OpenSSL Commands**
   ```bash
   # Create certs directory
   mkdir certs
   
   # Generate private key
   openssl genrsa -out certs/server.key 2048
   
   # Generate certificate
   openssl req -new -x509 -key certs/server.key -out certs/server.cert -days 365 -subj "/C=US/ST=State/L=City/O=Organization/CN=localhost"
   ```

3. **Start the Server**
   ```bash
   npm start
   # or
   npm run dev
   ```

## Environment Variables

Add these to your `.env` file:

```env
# HTTPS Configuration
USE_HTTPS=true
SSL_KEY_PATH=./certs/server.key    # Optional: custom path to private key
SSL_CERT_PATH=./certs/server.cert  # Optional: custom path to certificate

# Update URLs to use HTTPS
FRONTEND_URL=https://localhost:3000
GOOGLE_REDIRECT_URI=https://localhost:5000/api/auth/callback
```

## Certificate Options

### Development (Self-Signed Certificates)
- Use the provided scripts to generate self-signed certificates
- Browser will show security warnings (expected for self-signed certs)
- Perfect for local development

### Production (Valid SSL Certificates)
- Use certificates from a Certificate Authority (CA)
- Let's Encrypt for free SSL certificates
- No browser security warnings

## File Structure

After generating certificates, your backend directory should include:

```
backend/
├── certs/
│   ├── server.key    # Private key
│   └── server.cert   # Certificate
├── generate-certs.ps1
├── generate-certs.bat
├── .env.example
└── server.js
```

## Troubleshooting

### OpenSSL Not Found
If you get "OpenSSL not found" errors:

1. **Install OpenSSL:**
   - Download from: https://slproweb.com/products/Win32OpenSSL.html
   - Or use Chocolatey: `choco install openssl`
   - Or use Windows Subsystem for Linux (WSL)

2. **Alternative: Use PowerShell Script**
   - The `generate-certs.ps1` script uses Windows built-in certificate tools

### Certificate Errors
- **"Certificate not found"**: Run the certificate generation script
- **"Permission denied"**: Run PowerShell/Command Prompt as administrator
- **Browser warnings**: Accept the self-signed certificate for development

### Port Already in Use
- Change the port in your `.env` file: `PORT=5001`
- Make sure to update frontend API URLs accordingly

## Security Notes

### Development
- Self-signed certificates are acceptable for local development
- Browser security warnings are expected and can be bypassed

### Production
- Use valid SSL certificates from a trusted CA
- Consider using a reverse proxy (nginx, Apache) for SSL termination
- Regular certificate renewal (Let's Encrypt auto-renewal)

## Integration with Frontend

Update your frontend configuration to use HTTPS:

```javascript
// In frontend .env or config
REACT_APP_API_URL=https://localhost:5000
```

## Google OAuth Configuration

Update your Google OAuth settings:
- Authorized redirect URIs: `https://localhost:5000/api/auth/callback`
- Authorized JavaScript origins: `https://localhost:3000`

## Additional Security Features

The HTTPS configuration includes:

- **HSTS (HTTP Strict Transport Security)**: Forces HTTPS connections
- **Enhanced CORS**: Supports both HTTP and HTTPS origins for development
- **Updated CSP**: Content Security Policy allows secure connections
- **Automatic Fallback**: Falls back to HTTP if HTTPS setup fails

## Commands Reference

```bash
# Generate certificates (PowerShell)
.\generate-certs.ps1

# Generate certificates (Batch)
generate-certs.bat

# Start with HTTPS
USE_HTTPS=true npm start

# Start with HTTP (fallback)
USE_HTTPS=false npm start
```
