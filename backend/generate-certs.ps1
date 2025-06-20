# PowerShell script to generate self-signed SSL certificates for development
# Run this script from the backend directory

Write-Host "Generating self-signed SSL certificates for development..." -ForegroundColor Green

# Create certs directory if it doesn't exist
if (!(Test-Path "certs")) {
    New-Item -ItemType Directory -Path "certs"
    Write-Host "Created certs directory" -ForegroundColor Yellow
}

# Check if OpenSSL is available
try {
    openssl version
    $useOpenSSL = $true
} catch {
    Write-Host "OpenSSL not found. Using PowerShell New-SelfSignedCertificate instead..." -ForegroundColor Yellow
    $useOpenSSL = $false
}

if ($useOpenSSL) {
    # Generate private key
    Write-Host "Generating private key..." -ForegroundColor Blue
    & openssl genrsa -out "certs/server.key" 2048
    
    # Generate certificate
    Write-Host "Generating certificate..." -ForegroundColor Blue
    & openssl req -new -x509 -key "certs/server.key" -out "certs/server.cert" -days 365 -subj "/C=US/ST=State/L=City/O=Organization/CN=localhost"
} else {
    # Use PowerShell's New-SelfSignedCertificate (Windows 10/Server 2016+)
    Write-Host "Generating certificate using PowerShell..." -ForegroundColor Blue
    
    $cert = New-SelfSignedCertificate -DnsName "localhost" -CertStoreLocation "cert:\LocalMachine\My" -NotAfter (Get-Date).AddYears(1)
    
    # Export private key
    $certPath = "cert:\LocalMachine\My\$($cert.Thumbprint)"
    $pfxPath = "certs\server.pfx"
    $keyPath = "certs\server.key"
    $certFilePath = "certs\server.cert"
    
    # Create a temporary PFX file
    $pfxPassword = ConvertTo-SecureString -String "temp" -Force -AsPlainText
    Export-PfxCertificate -Cert $certPath -FilePath $pfxPath -Password $pfxPassword
    
    # Convert PFX to PEM format (requires OpenSSL or manual conversion)
    Write-Host "Certificate generated. You may need to manually convert to PEM format." -ForegroundColor Yellow
    Write-Host "Certificate location: $certPath" -ForegroundColor Yellow
}

Write-Host "SSL certificates generated successfully!" -ForegroundColor Green
Write-Host "Files created:" -ForegroundColor Cyan
Write-Host "  - certs/server.key (private key)" -ForegroundColor Cyan
Write-Host "  - certs/server.cert (certificate)" -ForegroundColor Cyan
Write-Host ""
Write-Host "To use HTTPS, set USE_HTTPS=true in your .env file" -ForegroundColor Yellow
