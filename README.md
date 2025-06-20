# Gmail Email Viewer

A comprehensive full-stack application for viewing and managing Gmail emails with a modern Node.js + Express backend and a React + TypeScript frontend.

## 🌟 Features

### Backend Features
- **🔐 Google OAuth2 Authentication** - Secure user authentication with Google
- **📧 Gmail API Integration** - Full access to Gmail data
- **💾 Email Metadata Storage** - Efficient storage with Sequelize ORM
- **🔍 Advanced Search & Filtering** - Powerful email search capabilities
- **⚡ Real-time Synchronization** - Keep emails up-to-date
- **🛡️ Security** - JWT tokens, rate limiting, input validation
- **📊 Analytics** - Email statistics and user activity tracking
- **🔄 Token Management** - Automatic token refresh handling

### Frontend Features
- **🎨 Modern UI** - Beautiful, responsive design with Tailwind CSS
- **📱 Mobile-First** - Fully responsive across all devices
- **⚡ Real-time Updates** - Live email synchronization
- **🔍 Smart Search** - Advanced filtering and search capabilities
- **⭐ Email Actions** - Star, mark important, read/unread
- **🏷️ Label Management** - Gmail label support
- **📎 Attachment Handling** - View emails with attachments
- **🚀 Performance** - Optimized with React Query caching

## 🏗️ Architecture

```
gmail-email-viewer/
├── backend/                 # Node.js + Express API
│   ├── config/             # Database and app configuration
│   ├── middleware/         # Express middleware (auth, validation, etc.)
│   ├── models/             # Sequelize database models
│   ├── routes/             # API route handlers
│   ├── services/           # Business logic (auth, gmail, etc.)
│   └── server.js           # Express server entry point
├── frontend/               # React + TypeScript app
│   ├── src/
│   │   ├── components/     # React components
│   │   │   ├── auth/       # Authentication components
│   │   │   ├── email/      # Email-related components
│   │   │   └── common/     # Shared UI components
│   │   ├── context/        # React context providers
│   │   ├── hooks/          # Custom React hooks
│   │   ├── services/       # API client services
│   │   └── types/          # TypeScript type definitions
│   └── public/             # Static assets
└── README.md               # This file
```

## 🚀 Quick Start

### Prerequisites

- Node.js 16 or higher
- PostgreSQL database
- Google Cloud Console project with Gmail API enabled

### 1. Clone and Install

```bash
# Clone the repository
git clone <repository-url>
cd gmail-email-viewer

# Install all dependencies (root, backend, frontend)
npm run install:all
```

### 2. Setup Google OAuth2

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable Gmail API
4. Create OAuth 2.0 credentials
5. Add authorized redirect URIs:
   - `http://localhost:3001/api/auth/callback` (backend)
   - `http://localhost:3000/auth/callback` (frontend)

### 3. Configure Backend

Create `backend/.env`:
```env
# Server Configuration
PORT=3001
NODE_ENV=development

# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=gmail_viewer
DB_USER=your_username
DB_PASSWORD=your_password

# Google OAuth2 Configuration
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_REDIRECT_URI=http://localhost:3001/api/auth/callback

# JWT Configuration
JWT_SECRET=your_super_secret_jwt_key_here
JWT_EXPIRES_IN=7d

# Frontend URL (for CORS)
FRONTEND_URL=http://localhost:3000
```

### 4. Configure Frontend

Create `frontend/.env`:
```env
REACT_APP_API_URL=http://localhost:3001/api
```

### 5. Setup Database

```bash
# Create PostgreSQL database
createdb gmail_viewer

# Run backend to initialize database tables
cd backend
npm run dev
```

### 6. Start Development Servers

```bash
# Start both frontend and backend concurrently
npm run dev

# Or start individually:
npm run dev:backend    # Backend on http://localhost:3001
npm run dev:frontend   # Frontend on http://localhost:3000
```

## 📚 API Documentation

### Authentication Endpoints

- `GET /api/auth/google` - Get Google OAuth URL
- `POST /api/auth/callback` - Handle OAuth callback
- `POST /api/auth/refresh` - Refresh JWT token

### Email Endpoints

- `GET /api/emails` - Get emails with pagination and filtering
- `GET /api/emails/:id` - Get single email by ID
- `POST /api/emails/sync` - Sync emails from Gmail
- `PATCH /api/emails/:id/read` - Mark email as read/unread
- `PATCH /api/emails/:id/important` - Mark email as important
- `PATCH /api/emails/:id/star` - Star/unstar email
- `GET /api/emails/stats` - Get email statistics

### User Endpoints

- `GET /api/users/profile` - Get user profile
- `GET /api/users/activity` - Get user activity logs

## 🔧 Configuration

### Environment Variables

#### Backend Environment Variables

| Variable | Description | Required | Default |
|----------|-------------|----------|---------|
| `PORT` | Server port | No | 3001 |
| `NODE_ENV` | Environment mode | No | development |
| `DB_HOST` | Database host | Yes | - |
| `DB_PORT` | Database port | No | 5432 |
| `DB_NAME` | Database name | Yes | - |
| `DB_USER` | Database user | Yes | - |
| `DB_PASSWORD` | Database password | Yes | - |
| `GOOGLE_CLIENT_ID` | Google OAuth client ID | Yes | - |
| `GOOGLE_CLIENT_SECRET` | Google OAuth client secret | Yes | - |
| `GOOGLE_REDIRECT_URI` | OAuth redirect URI | Yes | - |
| `JWT_SECRET` | JWT signing secret | Yes | - |
| `JWT_EXPIRES_IN` | JWT expiration time | No | 7d |
| `FRONTEND_URL` | Frontend URL for CORS | No | http://localhost:3000 |

#### Frontend Environment Variables

| Variable | Description | Required | Default |
|----------|-------------|----------|---------|
| `REACT_APP_API_URL` | Backend API URL | Yes | - |

## 🧪 Testing

### Backend Testing

```bash
cd backend
npm test
```

### Frontend Testing

```bash
cd frontend
npm test
```

### E2E Testing

```bash
# Run full application tests
npm run test:e2e
```

## 🏗️ Building for Production

### Build Backend

```bash
cd backend
npm run build
```

### Build Frontend

```bash
cd frontend
npm run build
```

### Build Both

```bash
# Build entire application
npm run build
```

## 🚀 Deployment

### Environment Setup

1. **Production Database**: Set up PostgreSQL database
2. **Google OAuth**: Update redirect URIs for production domain
3. **Environment Variables**: Configure production environment variables
4. **HTTPS**: Ensure HTTPS is enabled for OAuth2

### Backend Deployment (Node.js)

Deploy to platforms like:
- **Heroku** - Easy Node.js deployment
- **AWS Elastic Beanstalk** - Scalable deployment
- **DigitalOcean App Platform** - Simple deployment
- **Railway** - Modern deployment platform

### Frontend Deployment (React)

Deploy to platforms like:
- **Netlify** - Automatic deployments from Git
- **Vercel** - Zero-config React deployments
- **AWS S3 + CloudFront** - Scalable static hosting
- **GitHub Pages** - Free hosting for public repos

### Docker Deployment

```bash
# Build and run with Docker Compose
docker-compose up --build
```

## 🔐 Security Features

- **OAuth2 Authentication** - Secure Google authentication
- **JWT Tokens** - Stateless authentication
- **Rate Limiting** - API protection against abuse
- **Input Validation** - Comprehensive request validation
- **CORS Protection** - Cross-origin request security
- **Helmet.js** - Security headers
- **SQL Injection Protection** - Sequelize ORM protection

## 📊 Performance

- **Database Indexing** - Optimized database queries
- **Pagination** - Efficient data loading
- **Caching** - React Query for frontend caching
- **Connection Pooling** - Database connection optimization
- **Lazy Loading** - Frontend component optimization

## 🛠️ Development

### Code Style

- **ESLint** - JavaScript/TypeScript linting
- **Prettier** - Code formatting
- **TypeScript** - Type safety
- **Conventional Commits** - Commit message standards

### Development Tools

- **Nodemon** - Backend auto-restart
- **React Fast Refresh** - Frontend hot reloading
- **VS Code Extensions** - Recommended development setup

## 🐛 Troubleshooting

### Common Issues

1. **Database Connection Errors**
   - Verify PostgreSQL is running
   - Check database credentials
   - Ensure database exists

2. **Google OAuth Errors**
   - Verify client ID and secret
   - Check redirect URIs
   - Ensure Gmail API is enabled

3. **CORS Errors**
   - Check FRONTEND_URL in backend .env
   - Verify frontend URL in CORS configuration

4. **Token Expiration**
   - Implement automatic token refresh
   - Check JWT_EXPIRES_IN configuration

### Debug Mode

Enable debug logging:

Backend:
```env
DEBUG=gmail-viewer:*
```

Frontend:
```env
REACT_APP_DEBUG=true
```

## 📝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new features
5. Ensure all tests pass
6. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgments

- Google Gmail API for email access
- React team for the amazing framework
- Tailwind CSS for the utility-first CSS framework
- All open-source contributors

## 📞 Support

For support, email [your-email] or create an issue in the repository.

---

**Happy coding! 🚀**
