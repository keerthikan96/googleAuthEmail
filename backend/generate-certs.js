const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Create certs directory if it doesn't exist
const certsDir = path.join(__dirname, 'certs');
if (!fs.existsSync(certsDir)) {
  fs.mkdirSync(certsDir, { recursive: true });
  console.log('✅ Created certs directory');
}

const keyPath = path.join(certsDir, 'server.key');
const certPath = path.join(certsDir, 'server.cert');

// Check if certificates already exist
if (fs.existsSync(keyPath) && fs.existsSync(certPath)) {
  console.log('✅ SSL certificates already exist!');
  console.log('Files found:');
  console.log(`  - ${keyPath}`);
  console.log(`  - ${certPath}`);
  console.log('\n💡 To regenerate certificates, delete the existing files first.');
  console.log('📝 To use HTTPS, set USE_HTTPS=true in your .env file');
  process.exit(0);
}

console.log('🔐 Generating self-signed SSL certificates for development...');

// Try using the selfsigned package first
try {
  const selfsigned = require('selfsigned');
  
  console.log('📦 Using selfsigned package to generate certificates...');
  
  const attrs = [
    { name: 'commonName', value: 'localhost' },
    { name: 'countryName', value: 'US' },
    { shortName: 'ST', value: 'State' },
    { name: 'localityName', value: 'City' },
    { name: 'organizationName', value: 'Development' },
    { shortName: 'OU', value: 'IT Department' }
  ];

  const options = {
    keySize: 2048,
    days: 365,
    algorithm: 'sha256',
    extensions: [
      {
        name: 'basicConstraints',
        cA: true
      },
      {
        name: 'keyUsage',
        keyCertSign: true,
        digitalSignature: true,
        nonRepudiation: true,
        keyEncipherment: true,
        dataEncipherment: true
      },
      {
        name: 'extKeyUsage',
        serverAuth: true,
        clientAuth: true,
        codeSigning: true,
        timeStamping: true
      },
      {
        name: 'subjectAltName',
        altNames: [
          {
            type: 2, // DNS
            value: 'localhost'
          },
          {
            type: 7, // IP
            ip: '127.0.0.1'
          }
        ]
      }
    ]
  };

  const pems = selfsigned.generate(attrs, options);
  
  // Save private key
  fs.writeFileSync(keyPath, pems.private);
  console.log(`✅ Private key saved: ${keyPath}`);
  
  // Save certificate
  fs.writeFileSync(certPath, pems.cert);
  console.log(`✅ Certificate saved: ${certPath}`);
  
  console.log('\n🎉 SSL certificates generated successfully!');
  console.log('📋 Certificate details:');
  console.log('  - Algorithm: RSA 2048-bit');
  console.log('  - Validity: 365 days');
  console.log('  - Common Name: localhost');
  console.log('  - Subject Alternative Names: localhost, 127.0.0.1');
  console.log('\n📝 To use HTTPS, set USE_HTTPS=true in your .env file');
  console.log('⚠️  Browser will show security warnings (expected for self-signed certificates)');
  
} catch (selfsignedError) {
  console.log('❌ selfsigned package not available, trying OpenSSL...');
  
  try {
    // Check if OpenSSL is available
    execSync('openssl version', { stdio: 'pipe' });
    console.log('🔧 Using OpenSSL to generate certificates...');
    
    // Generate private key
    console.log('🔑 Generating private key...');
    execSync(`openssl genrsa -out "${keyPath}" 2048`, { stdio: 'inherit' });
    
    // Generate certificate
    console.log('📜 Generating certificate...');
    execSync(`openssl req -new -x509 -key "${keyPath}" -out "${certPath}" -days 365 -subj "/C=US/ST=State/L=City/O=Development/CN=localhost"`, { stdio: 'inherit' });
    
    console.log('\n✅ SSL certificates generated successfully with OpenSSL!');
    console.log('Files created:');
    console.log(`  - ${keyPath} (private key)`);
    console.log(`  - ${certPath} (certificate)`);
    console.log('\n📝 To use HTTPS, set USE_HTTPS=true in your .env file');
    
  } catch (opensslError) {
    console.log('\n❌ Certificate generation failed.');
    console.log('\n🔧 Solutions:');
    console.log('1. Install the selfsigned package: npm install --save-dev selfsigned');
    console.log('2. Install OpenSSL from: https://slproweb.com/products/Win32OpenSSL.html');
    console.log('3. Use Chocolatey: choco install openssl');
    console.log('4. Use Windows Subsystem for Linux (WSL)');
    console.log('5. Run PowerShell as Administrator and use generate-certs.ps1');
    
    // Create placeholder files with instructions
    const instructions = `# SSL Certificate Instructions

Automatic certificate generation failed. Please choose one of the following options:

## Option 1: Use selfsigned package (Recommended)
1. Install the package: npm install --save-dev selfsigned
2. Run: npm run generate-certs

## Option 2: Install OpenSSL
1. Download from: https://slproweb.com/products/Win32OpenSSL.html
2. Install and add to PATH
3. Run: npm run generate-certs

## Option 3: Use PowerShell (as Administrator)
1. Open PowerShell as Administrator
2. Run: .\\generate-certs.ps1

## Option 4: Manual Certificate Placement
Place your SSL certificate files here:
- server.key (private key)
- server.cert (certificate)

## Option 5: Use HTTP instead
Set USE_HTTPS=false in your .env file to continue with HTTP.

## Testing HTTPS
Once certificates are generated:
1. Set USE_HTTPS=true in your .env file
2. Start the server: npm start
3. Visit: https://localhost:5000
4. Accept the security warning (normal for self-signed certificates)
`;

    fs.writeFileSync(path.join(certsDir, 'README.txt'), instructions);
    console.log(`\n📄 Instructions saved to: ${path.join(certsDir, 'README.txt')}`);
    
    process.exit(1);
  }
}
