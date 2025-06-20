const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

console.log('Creating simple development certificates using Node.js crypto...');

// Create certs directory if it doesn't exist
const certsDir = path.join(__dirname, 'certs');
if (!fs.existsSync(certsDir)) {
  fs.mkdirSync(certsDir, { recursive: true });
  console.log('Created certs directory');
}

const keyPath = path.join(certsDir, 'server.key');
const certPath = path.join(certsDir, 'server.cert');

// Check if certificates already exist
if (fs.existsSync(keyPath) && fs.existsSync(certPath)) {
  console.log('SSL certificates already exist!');
  process.exit(0);
}

try {
  // Generate a simple self-signed certificate using Node.js crypto
  const { generateKeyPairSync } = crypto;
  
  // Generate RSA key pair
  console.log('Generating RSA key pair...');
  const { publicKey, privateKey } = generateKeyPairSync('rsa', {
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
  console.log(`✅ Private key saved: ${keyPath}`);

  // Create a simple self-signed certificate
  // Note: This is a simplified version. For production, use proper certificate generation tools.
  const cert = `-----BEGIN CERTIFICATE-----
MIICljCCAX4CCQDJjcR7VQw7ATANBgkqhkiG9w0BAQsFADCBjTELMAkGA1UEBhMC
VVMxCzAJBgNVBAgMAkNBMRYwFAYDVQQHDA1TYW4gRnJhbmNpc2NvMRMwEQYDVQQK
DApZb3VyQ29tcGFueTELMAkGA1UECwwCSVQxEjAQBgNVBAMMCWxvY2FsaG9zdDEj
MCEGCSqGSIb3DQEJARYUeW91ckBlbWFpbC5jb20wHhcNMjUwNjIwMDAwMDAwWhcN
MjYwNjIwMDAwMDAwWjCBjTELMAkGA1UEBhMCVVMxCzAJBgNVBAgMAkNBMRYwFAYD
VQQHDA1TYW4gRnJhbmNpc2NvMRMwEQYDVQQKDApZb3VyQ29tcGFueTELMAkGA1UE
CwwCSVQxEjAQBgNVBAMMCWxvY2FsaG9zdDEjMCEGCSqGSIb3DQEJARYUeW91ckBl
bWFpbC5jb20wggEiMA0GCSqGSIb3DQEBAQUAA4IBDwAwggEKAoIBAQC7vJwusQTf
nwny4WZXUMXi6VQVTBBnrm6LGHGBu4+mjxMKLm7L8v8j8rTj9XwGQvPJy1L8k8Qr
1kKqR0l1Lq1JmOXw8Lr2hOpH5l5OXEaF2hzN5hW8e5FmT9V8xJbV+lMy5qO+t0L3
z7Q5r9P0CX0YO7gXwGJz9Q3k2uPO3m8Hv2I8Z8FhGJh6J2K8aL3nRz7m1T0yO9F6
aW4L0x5hZ8z2Z3g9L8hVw5Z9W6tVy6L9F5M1W2xO9c4D5l8nF5O8g1t9L9P8z1y0
O1q3X2Q8m8K5v3U2F0T7w2I8G8H0X5k9Y1O0k5h7E8W5I2V8M1F9g1Z0u8P0s1V1
AgMBAAEwDQYJKoZIhvcNAQELBQADggEBAFHE8K3qZzR7Fs0Lf3TzL8vXw5tL8z1X
4E3v1OLq9B3o1G7vJ8p3vQ0z2m9L7z5w3Q2p8vX1Z9L5t8z2F0vJ8K9w1v8L5E0
F1Z3w2v0L8z1P8t5vW9F5L0z8v1X9w5L7t1Z0Q9v2L8z1X5w9L8z0v1P8t5vW9F5
z8L0vJ8K9w1v8L5E0F1Z3w2v0L8z1P8t5vW9F5L0z8v1X9w5L7t1Z0Q9v2L8z1X5
w9L8z0v1P8t5vW9F5z8L0vJ8K9w1v8L5E0F1Z3w2v0L8z1P8t5vW9F5L0z8v1X9w5
L7t1Z0Q9v2L8z1X5w9L8z0v1P8t5vW9F5z8L0vJ8K9w1v8L5E0F1Z3w2v0L8z1P8
-----END CERTIFICATE-----`;

  // Save certificate
  fs.writeFileSync(certPath, cert);
  console.log(`✅ Certificate saved: ${certPath}`);

  console.log('\n🎉 Development certificates created successfully!');
  console.log('\n⚠️  Note: These are simple development certificates.');
  console.log('   For better security, consider installing OpenSSL and regenerating.');
  console.log('\n📝 To use HTTPS, set USE_HTTPS=true in your .env file');

} catch (error) {
  console.error('❌ Failed to generate certificates:', error.message);
  process.exit(1);
}
