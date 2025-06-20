@echo off
echo Generating self-signed SSL certificates for development...

:: Create certs directory if it doesn't exist
if not exist "certs" (
    mkdir certs
    echo Created certs directory
)

:: Check if OpenSSL is available
openssl version >nul 2>&1
if %errorlevel% equ 0 (
    echo Using OpenSSL to generate certificates...
    
    :: Generate private key
    echo Generating private key...
    openssl genrsa -out "certs/server.key" 2048
    
    :: Generate certificate
    echo Generating certificate...
    openssl req -new -x509 -key "certs/server.key" -out "certs/server.cert" -days 365 -subj "/C=US/ST=State/L=City/O=Organization/CN=localhost"
    
    echo SSL certificates generated successfully!
    echo Files created:
    echo   - certs/server.key (private key)
    echo   - certs/server.cert (certificate)
    echo.
    echo To use HTTPS, set USE_HTTPS=true in your .env file
) else (
    echo OpenSSL not found. Please install OpenSSL or use the PowerShell script generate-certs.ps1
    echo.
    echo You can install OpenSSL from: https://slproweb.com/products/Win32OpenSSL.html
    echo Or use chocolatey: choco install openssl
)

pause
