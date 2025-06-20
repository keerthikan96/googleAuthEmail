const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Gmail Viewer API',
      version: '1.0.0',
      description: 'A comprehensive API for Gmail email viewing and management with OAuth2 authentication',
      contact: {
        name: 'API Support',
        email: 'support@gmailviewer.com',
      },
      license: {
        name: 'ISC',
        url: 'https://opensource.org/licenses/ISC',
      },
    },
    servers: [
      {
        url: process.env.API_BASE_URL || 'http://localhost:5000',
        description: 'Development server',
      },
      {
        url: 'https://api.gmailviewer.com',
        description: 'Production server',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'JWT token obtained from Google OAuth2 authentication',
        },
      },
      schemas: {
        User: {
          type: 'object',
          required: ['id', 'googleId', 'email', 'name'],
          properties: {
            id: {
              type: 'integer',
              description: 'Unique user identifier',
              example: 1,
            },
            googleId: {
              type: 'string',
              description: 'Google account identifier',
              example: '1234567890123456789',
            },
            email: {
              type: 'string',
              format: 'email',
              description: 'User email address',
              example: 'user@example.com',
            },
            name: {
              type: 'string',
              description: 'User display name',
              example: 'John Doe',
            },
            picture: {
              type: 'string',
              format: 'uri',
              description: 'User profile picture URL',
              example: 'https://lh3.googleusercontent.com/a/default-user',
            },
            lastSyncAt: {
              type: 'string',
              format: 'date-time',
              description: 'Last email synchronization timestamp',
              example: '2025-06-20T10:30:00Z',
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
              description: 'User creation timestamp',
              example: '2025-06-01T09:00:00Z',
            },
            updatedAt: {
              type: 'string',
              format: 'date-time',
              description: 'User last update timestamp',
              example: '2025-06-20T10:30:00Z',
            },
          },
        },
        Email: {
          type: 'object',
          required: ['id', 'gmailId', 'threadId', 'userId'],
          properties: {
            id: {
              type: 'integer',
              description: 'Unique email identifier',
              example: 1,
            },
            gmailId: {
              type: 'string',
              description: 'Gmail message identifier',
              example: '18a1b2c3d4e5f6g7',
            },
            threadId: {
              type: 'string',
              description: 'Gmail thread identifier',
              example: '18a1b2c3d4e5f6g7',
            },
            userId: {
              type: 'integer',
              description: 'Associated user identifier',
              example: 1,
            },
            subject: {
              type: 'string',
              description: 'Email subject line',
              example: 'Important Meeting Tomorrow',
            },
            sender: {
              type: 'string',
              description: 'Email sender address',
              example: 'sender@example.com',
            },
            senderName: {
              type: 'string',
              description: 'Email sender display name',
              example: 'Jane Smith',
            },
            recipient: {
              type: 'string',
              description: 'Email recipient address',
              example: 'user@example.com',
            },
            snippet: {
              type: 'string',
              description: 'Email content preview',
              example: 'Hi John, I wanted to remind you about our meeting tomorrow at 2 PM...',
            },
            body: {
              type: 'string',
              description: 'Full email content',
              example: 'Hi John,\n\nI wanted to remind you about our meeting tomorrow at 2 PM in the conference room.\n\nBest regards,\nJane',
            },
            isUnread: {
              type: 'boolean',
              description: 'Email read status',
              example: true,
            },
            hasAttachment: {
              type: 'boolean',
              description: 'Whether email has attachments',
              example: false,
            },
            labels: {
              type: 'array',
              items: {
                type: 'string',
              },
              description: 'Gmail labels applied to the email',
              example: ['INBOX', 'IMPORTANT'],
            },
            receivedDate: {
              type: 'string',
              format: 'date-time',
              description: 'Email received timestamp',
              example: '2025-06-20T09:15:00Z',
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
              description: 'Record creation timestamp',
              example: '2025-06-20T09:16:00Z',
            },
            updatedAt: {
              type: 'string',
              format: 'date-time',
              description: 'Record last update timestamp',
              example: '2025-06-20T09:16:00Z',
            },
          },
        },
        ApiResponse: {
          type: 'object',
          required: ['success', 'message'],
          properties: {
            success: {
              type: 'boolean',
              description: 'Request success status',
              example: true,
            },
            message: {
              type: 'string',
              description: 'Response message',
              example: 'Operation completed successfully',
            },
            data: {
              type: 'object',
              description: 'Response data payload',
            },
            error: {
              type: 'string',
              description: 'Error code (present when success is false)',
              example: 'VALIDATION_ERROR',
            },
          },
        },
        PaginatedResponse: {
          allOf: [
            {
              $ref: '#/components/schemas/ApiResponse',
            },
            {
              type: 'object',
              properties: {
                pagination: {
                  type: 'object',
                  properties: {
                    page: {
                      type: 'integer',
                      description: 'Current page number',
                      example: 1,
                    },
                    limit: {
                      type: 'integer',
                      description: 'Items per page',
                      example: 20,
                    },
                    total: {
                      type: 'integer',
                      description: 'Total number of items',
                      example: 150,
                    },
                    totalPages: {
                      type: 'integer',
                      description: 'Total number of pages',
                      example: 8,
                    },
                  },
                },
              },
            },
          ],
        },
        Error: {
          type: 'object',
          required: ['success', 'message'],
          properties: {
            success: {
              type: 'boolean',
              example: false,
            },
            message: {
              type: 'string',
              description: 'Error message',
              example: 'Authentication required',
            },
            error: {
              type: 'string',
              description: 'Error code',
              example: 'UNAUTHORIZED',
            },
            details: {
              type: 'object',
              description: 'Additional error details',
            },
          },
        },
      },
    },
    security: [
      {
        bearerAuth: [],
      },
    ],
    tags: [
      {
        name: 'Authentication',
        description: 'OAuth2 authentication endpoints',
      },
      {
        name: 'Emails',
        description: 'Email management and retrieval endpoints',
      },
      {
        name: 'Users',
        description: 'User profile and settings endpoints',
      },
      {
        name: 'Health',
        description: 'API health and status endpoints',
      },
    ],
  },
  apis: [
    './routes/*.js',
    './server.js',
  ],
};

const specs = swaggerJsdoc(options);

const swaggerOptions = {
  customCss: `
    .swagger-ui .topbar { display: none }
    .swagger-ui .info .title { color: #1f2937; }
    .swagger-ui .scheme-container { background: #f8fafc; padding: 20px; border-radius: 8px; }
  `,
  customSiteTitle: 'Gmail Viewer API Documentation',
  customfavIcon: '/favicon.ico',
  swaggerOptions: {
    persistAuthorization: true,
    displayRequestDuration: true,
    filter: true,
    showRequestHeaders: true,
  },
};

module.exports = {
  specs,
  swaggerUi,
  swaggerOptions,
};
