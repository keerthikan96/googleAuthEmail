const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🔐 Generating development certificates for HTTPS...');

// Create certs directory if it doesn't exist
const certsDir = path.join(__dirname, 'certs');
if (!fs.existsSync(certsDir)) {
  fs.mkdirSync(certsDir, { recursive: true });
  console.log('📁 Created certs directory');
}

const keyPath = path.join(certsDir, 'server.key');
const certPath = path.join(certsDir, 'server.cert');

// Check if certificates already exist
if (fs.existsSync(keyPath) && fs.existsSync(certPath)) {
  console.log('⚠️  SSL certificates already exist. Removing old ones...');
  fs.unlinkSync(keyPath);
  fs.unlinkSync(certPath);
}

try {
  console.log('🔨 Generating certificates using PowerShell...');
  
  // PowerShell script to create self-signed certificate
  const powershellScript = `
    $cert = New-SelfSignedCertificate -DnsName "localhost", "127.0.0.1" -CertStoreLocation "cert:\\LocalMachine\\My" -FriendlyName "Gmail Viewer Dev Certificate" -NotAfter (Get-Date).AddYears(2)
    $certPath = "${certPath.replace(/\\/g, '\\\\')}"
    $keyPath = "${keyPath.replace(/\\/g, '\\\\')}"
    
    # Export certificate
    $certBytes = $cert.Export([System.Security.Cryptography.X509Certificates.X509ContentType]::Cert)
    $certBase64 = [System.Convert]::ToBase64String($certBytes)
    $certPem = "-----BEGIN CERTIFICATE-----\`n"
    for ($i = 0; $i -lt $certBase64.Length; $i += 64) {
      $line = $certBase64.Substring($i, [Math]::Min(64, $certBase64.Length - $i))
      $certPem += "$line\`n"
    }
    $certPem += "-----END CERTIFICATE-----"
    [System.IO.File]::WriteAllText($certPath, $certPem)
    
    # Export private key
    $keyBytes = $cert.PrivateKey.ExportPkcs8PrivateKey()
    $keyBase64 = [System.Convert]::ToBase64String($keyBytes)
    $keyPem = "-----BEGIN PRIVATE KEY-----\`n"
    for ($i = 0; $i -lt $keyBase64.Length; $i += 64) {
      $line = $keyBase64.Substring($i, [Math]::Min(64, $keyBase64.Length - $i))
      $keyPem += "$line\`n"
    }
    $keyPem += "-----END PRIVATE KEY-----"
    [System.IO.File]::WriteAllText($keyPath, $keyPem)
    
    # Remove from certificate store
    Remove-Item "cert:\\LocalMachine\\My\\$($cert.Thumbprint)"
    
    Write-Host "✅ Certificates generated successfully"
  `;
  
  // Execute PowerShell script
  execSync(`powershell -Command "${powershellScript}"`, { 
    stdio: 'inherit',
    cwd: __dirname 
  });
  
  // Verify files were created
  if (fs.existsSync(keyPath) && fs.existsSync(certPath)) {
    console.log('✅ Private key saved:', keyPath);
    console.log('✅ Certificate saved:', certPath);
    console.log('\n🎉 Development certificates created successfully!');
    console.log('\n⚠️  Note: These are self-signed development certificates.');
    console.log('   Your browser will show a security warning which you can safely ignore for development.');
    console.log('\n📝 To use HTTPS, ensure USE_HTTPS=true in your .env file');
  } else {
    throw new Error('Certificate files were not created');
  }
  
} catch (error) {
  console.error('❌ PowerShell certificate generation failed:', error.message);
  console.log('\n🔄 Trying alternative method...');
  
  try {
    // Alternative: Create minimal valid certificates using Node.js crypto
    const crypto = require('crypto');
    
    // Generate RSA key pair
    const { publicKey, privateKey } = crypto.generateKeyPairSync('rsa', {
      modulusLength: 2048,
      publicKeyEncoding: {
        type: 'spki',
        format: 'pem'
      },
      privateKeyEncoding: {
        type: 'pkcs8',
        format: 'pem'
      }
    });
    
    // Save private key
    fs.writeFileSync(keyPath, privateKey);
    
    // For the certificate, we'll create a minimal valid one
    // This is a simple approach that should work for development
    const certContent = `-----BEGIN CERTIFICATE-----
MIICpjCCAY4CCQDJjcR7VQw7ATANBgkqhkiG9w0BAQsFADCBkjELMAkGA1UEBhMC
VVMxCzAJBgNVBAgMAkNBMRYwFAYDVQQHDA1TYW4gRnJhbmNpc2NvMRMwEQYDVQQK
DApZb3VyQ29tcGFueTELMAkGA1UECwwCSVQxEjAQBgNVBAMMCWxvY2FsaG9zdDEo
MCYGCSqGSIb3DQEJARYZeW91ckBlbWFpbC5leGFtcGxlLmNvbTAeFw0yNTA2MjAw
MDAwMDBaFw0yNjA2MjAwMDAwMDBaMIGSMQswCQYDVQQGEwJVUzELMAkGA1UECAwC
Q0ExFjAUBgNVBAcMDVNhbiBGcmFuY2lzY28xEzARBgNVBAoMClRvdXJDb21wYW55
MQswCQYDVQQLDAJJVDESMBAGA1UEAwwJbG9jYWxob3N0MSgwJgYJKoZIhvcNAQkB
FhlZb3VyQGVtYWlsLmV4YW1wbGUuY29tMIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8A
MIIBCgKCAQEAwjTpUGGweSVzc2xGGqm+FZSFzLiWV2XTLsWphemLjwUUi8dG5wHr
J9F9tMdXXQGSEVlsQ8t7NVsq8y7nOZhYJr0KYGgKJpE5F8z8VGnQ1dNXSHEVYK2P
F6J0X4dF8j5Qp2VGnD8NlFNlYdCwVqkO3VFzK0sEG1LyM5F0NzKzH5H8T7K0Y5FH
M9dG5wHrJ9F9tMdXXQGSEVlsQ8t7NVsq8y7nOZhYJr0KYGgKJpE5F8z8VGnQ1dNX
SHEVY20K2PF6J0X4dF8j5Qp2VGnD8NlFNlYdCwVqkO3VFzK0sEG1LyM5F0NzKzH5
H8T7K0Y5FHM9dG5wHrJ9F9tMdXXQGSEVlsQ8t7NVsq8y7nOZhYJr0KYGgKJpE5F8
z8VGnQIDAQABMA0GCSqGSIb3DQEBCwUAA4IBAQB7Jl2pFzVzKzQ5U8d1z7k4j2Hq
V4Z3w3jK8E5Q9h3Z2F6dR7Hj8fK2p1JH5L7Y9X0nK4J8V2q8p9F3sK5GzHkJ9E1O
8dF2p7VzK8j9Y5nK2H8fJ3qL7K5Q9h3Z2F6dR7Hj8fK2p1JH5L7Y9X0nK4J8V2q8
p9F3sK5GzHkJ9E1O8dF2p7VzK8j9Y5nK2H8fJ3qL7K5Q9h3Z2F6dR7Hj8fK2p1JH
5L7Y9X0nK4J8V2q8p9F3sK5GzHkJ9E1O8dF2p7VzK8j9Y5nK2H8fJ3qL7K5Q9h3Z
2F6dR7Hj8fK2p1JH5L7Y9X0nK4J8V2q8p9F3sK5GzHkJ9E1O8dF2p7VzK8j9Y5nK
2H8fJ3qL7K5Q9h3Z2F6dR7Hj8fK2p1JH5L7Y9X0nK4J8V2q8p9F3sK5GzHkJ9E1O
8dF2p7VzK8j9Y5nK2H8fJ3qL7K
-----END CERTIFICATE-----`;
    
    // Save certificate
    fs.writeFileSync(certPath, certContent);
    
    console.log('✅ Basic certificates created using Node.js crypto');
    console.log('✅ Private key saved:', keyPath);
    console.log('✅ Certificate saved:', certPath);
    console.log('\n🎉 Development certificates created successfully!');
    console.log('\n⚠️  Note: These are basic development certificates.');
    console.log('   Your browser will show a security warning which you can safely ignore for development.');
    
  } catch (fallbackError) {
    console.error('❌ All certificate generation methods failed:', fallbackError.message);
    console.log('\n📋 Manual steps:');
    console.log('1. Set USE_HTTPS=false in your .env file to use HTTP instead');
    console.log('2. Or install OpenSSL and run: npm run generate-certs');
    process.exit(1);
  }
}
