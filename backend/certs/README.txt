# SSL Certificate Instructions

The automatic certificate generation failed because OpenSSL is not available.

## Manual Generation Options:

### Option 1: Install OpenSSL
1. Download from: https://slproweb.com/products/Win32OpenSSL.html
2. Install and add to PATH
3. Run: npm run generate-certs

### Option 2: Use PowerShell (as Administrator)
1. Open PowerShell as Administrator
2. Run: .\generate-certs.ps1

### Option 3: Use existing certificates
Place your SSL certificate files here:
- server.key (private key)
- server.cert (certificate)

### Option 4: Use HTTP instead
Set USE_HTTPS=false in your .env file to use HTTP instead.
