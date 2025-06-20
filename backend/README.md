# Gmail Viewer Backend

A secure Node.js + Express backend for the Gmail Viewer application with Google OAuth2 authentication and Gmail API integration.

## Features

- 🔐 **Secure Authentication**: Google OAuth2 with JWT tokens
- 📧 **Gmail Integration**: Fetch, search, and manage emails
- 🛡️ **Security**: Rate limiting, input validation, SQL injection protection
- 📊 **Database**: MySQL with Sequelize ORM
- 🔍 **Search**: Advanced email search with filters
- 📝 **Logging**: Comprehensive error and activity logging
- ⚡ **Performance**: Connection pooling, caching, pagination

## Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MySQL with Sequelize ORM
- **Authentication**: Google OAuth2, JWT
- **Email**: Gmail API, IMAP
- **Security**: Helmet, CORS, Rate Limiting
- **Validation**: Express Validator
- **Logging**: Winston

## Prerequisites

- Node.js (v14 or higher)
- MySQL database
- Google Cloud Project with Gmail API enabled
- Google OAuth2 credentials

## Installation

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Environment Setup**:
   Copy `.env` file and configure your variables:
   ```env
   # Google OAuth2 Configuration
   GOOGLE_CLIENT_ID=your_google_client_id_here
   GOOGLE_CLIENT_SECRET=your_google_client_secret_here
   GOOGLE_REDIRECT_URI=http://localhost:5000/auth/callback

   # JWT Configuration
   JWT_SECRET=your_super_secret_jwt_key_here_minimum_32_characters   # Database Configuration
   DB_HOST=localhost
   DB_USER=root
   DB_PASSWORD=your_database_password
   DB_NAME=gmail_viewer_db

   # Server Configuration
   PORT=5001
   NODE_ENV=development
   FRONTEND_URL=https://localhost:3000
   
   # HTTPS Configuration (Optional)
   USE_HTTPS=true
   # SSL_KEY_PATH=./certs/server.key
   # SSL_CERT_PATH=./certs/server.cert
   ```

3. **HTTPS Setup (Optional but Recommended)**:
   ```bash
   # Generate SSL certificates for development
   npm run generate-certs
   
   # Set HTTPS in .env file
   USE_HTTPS=true
   ```
   
   > **Note**: For production, use valid SSL certificates from a Certificate Authority.

4. **Database Setup**:
   ```bash
   # Create database
   mysql -u root -p
   CREATE DATABASE gmail_viewer_db;
   ```

4. **Google Cloud Setup**:
   - Create a project in Google Cloud Console
   - Enable Gmail API
   - Create OAuth2 credentials
   - Add authorized redirect URIs

## Usage

### Development
```bash
npm run dev
```

### Production
```bash
npm start
```

## API Endpoints

### Authentication
- `GET /api/auth/google` - Get Google OAuth URL
- `GET /api/auth/callback` - OAuth callback handler
- `GET /api/auth/me` - Get current user info
- `POST /api/auth/refresh` - Refresh access token
- `POST /api/auth/logout` - Logout user
- `GET /api/auth/status` - Check auth status

### Emails
- `GET /api/emails` - Get user emails (paginated)
- `GET /api/emails/:id` - Get specific email
- `PUT /api/emails/:id` - Update email status
- `POST /api/emails/sync` - Sync from Gmail
- `POST /api/emails/search` - Advanced search
- `GET /api/emails/stats/overview` - Email statistics
- `PUT /api/emails/bulk` - Bulk update emails

### Users
- `GET /api/users/profile` - Get user profile
- `PUT /api/users/profile` - Update profile
- `GET /api/users/activity` - User activity stats

## Security Features

### Authentication & Authorization
- JWT tokens with expiration
- Google OAuth2 with refresh tokens
- Token validation middleware
- User ownership validation

### Input Validation
- Request parameter validation
- SQL injection prevention
- XSS protection
- CSRF protection

### Rate Limiting
- Global API rate limiting
- Authentication rate limiting
- Email operation rate limiting
- IP-based tracking

### Security Headers
- Helmet.js security headers
- CORS configuration
- Content Security Policy
- HTTPS enforcement (production)

## Database Schema

### Users Table
```sql
CREATE TABLE users (
  id INT PRIMARY KEY AUTO_INCREMENT,
  googleId VARCHAR(255) UNIQUE NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  picture TEXT,
  accessToken TEXT,
  refreshToken TEXT,
  tokenExpiry DATETIME,
  lastLoginAt DATETIME,
  isActive BOOLEAN DEFAULT TRUE,
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

### Email Metadata Table
```sql
CREATE TABLE email_metadata (
  id INT PRIMARY KEY AUTO_INCREMENT,
  userId INT NOT NULL,
  messageId VARCHAR(255) NOT NULL,
  threadId VARCHAR(255),
  subject TEXT,
  sender VARCHAR(255) NOT NULL,
  senderName VARCHAR(255),
  recipient TEXT,
  snippet TEXT,
  bodyPreview TEXT,
  receivedDate DATETIME NOT NULL,
  isRead BOOLEAN DEFAULT FALSE,
  isStarred BOOLEAN DEFAULT FALSE,
  hasAttachments BOOLEAN DEFAULT FALSE,
  labels JSON,
  priority ENUM('high', 'medium', 'low') DEFAULT 'medium',
  size INT,
  gmailMessageId VARCHAR(255),
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE KEY unique_user_message (userId, messageId)
);
```

## Error Handling

The application implements comprehensive error handling:

- **Global Error Handler**: Catches all unhandled errors
- **Async Error Wrapper**: Handles async/await errors
- **Validation Errors**: Input validation with detailed messages
- **Database Errors**: Sequelize error handling
- **API Errors**: Google API and external service errors
- **Authentication Errors**: JWT and OAuth errors

## Logging

Winston logger with multiple transports:
- **Console**: Development logging
- **File**: Error and combined logs
- **Structured**: JSON format for production

Log levels: error, warn, info, debug

## Performance Optimizations

- **Database Connection Pooling**: Efficient database connections
- **Query Optimization**: Indexed queries and pagination
- **Caching**: Token caching and result caching
- **Batch Operations**: Bulk email operations
- **Rate Limiting**: Prevent API abuse

## Deployment

### Environment Variables
Ensure all production environment variables are set:
- Database credentials
- Google OAuth credentials
- JWT secret (secure random string)
- HTTPS URLs for production

### Production Considerations
- Use environment-specific configuration
- Enable HTTPS
- Set up proper logging
- Configure reverse proxy (nginx)
- Set up monitoring and health checks
- Regular database backups

## Troubleshooting

### Common Issues

1. **Database Connection Error**:
   - Check MySQL service is running
   - Verify database credentials
   - Ensure database exists

2. **Google OAuth Error**:
   - Verify OAuth credentials
   - Check redirect URI configuration
   - Ensure Gmail API is enabled

3. **JWT Token Error**:
   - Check JWT secret configuration
   - Verify token expiration settings
   - Clear browser storage

4. **Rate Limiting**:
   - Check rate limit configuration
   - Monitor API usage
   - Implement proper retry logic

### Debug Mode
Set `NODE_ENV=development` for detailed error messages and stack traces.

## Contributing

1. Fork the repository
2. Create feature branch
3. Add tests for new features
4. Ensure all tests pass
5. Submit pull request

## License

MIT License - see LICENSE file for details.

## HTTPS Configuration

The backend supports both HTTP and HTTPS modes. HTTPS is recommended for production and provides better security.

### Quick HTTPS Setup

1. **Generate SSL Certificates**:
   ```bash
   npm run generate-certs
   ```

2. **Enable HTTPS**:
   ```env
   USE_HTTPS=true
   ```

3. **Start Server**:
   ```bash
   npm start
   # Server will run on https://localhost:5001
   ```

### Certificate Options

#### Development (Self-Signed)
- Automatic generation with `npm run generate-certs`
- Uses the `selfsigned` package for easy setup
- Browser security warnings are expected (can be bypassed)

#### Production (Valid Certificates)
- Use certificates from a trusted Certificate Authority
- Let's Encrypt for free SSL certificates
- No browser security warnings

### Environment Variables

```env
# Enable/disable HTTPS
USE_HTTPS=true

# Custom certificate paths (optional)
SSL_KEY_PATH=./certs/server.key
SSL_CERT_PATH=./certs/server.cert

# Update URLs to use HTTPS
FRONTEND_URL=https://localhost:3000
GOOGLE_REDIRECT_URI=https://localhost:5001/api/auth/callback
```

### Certificate Generation Scripts

- **`npm run generate-certs`**: Node.js script (recommended)
- **`generate-certs.ps1`**: PowerShell script for Windows
- **`generate-certs.bat`**: Batch script for Windows

### Security Features with HTTPS

- **HSTS**: HTTP Strict Transport Security headers
- **Enhanced CORS**: Supports both HTTP and HTTPS origins
- **Secure Cookies**: Cookies marked as secure in production
- **CSP Updates**: Content Security Policy allows secure connections

### Troubleshooting

- **Port conflicts**: Change `PORT` in `.env` file
- **Certificate errors**: Delete `certs/` folder and regenerate
- **Browser warnings**: Accept self-signed certificates in development
- **OpenSSL not found**: The script will automatically use the Node.js fallback

For detailed HTTPS setup instructions, see `HTTPS_SETUP.md`.
