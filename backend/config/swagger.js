// config/swagger.js
// Basic Swagger/OpenAPI setup using swagger-jsdoc

const swaggerJsdoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.3',
    info: {
      title: 'Edumath API',
      version: '1.0.0',
      description: 'REST API for Edumath platform',
    },
    servers: [
      { url: 'http://localhost:' + (process.env.PORT || 8000) }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
    },
    security: [{ bearerAuth: [] }],
    paths: {
      '/api/auth/register': {
        post: {
          summary: 'Kayıt Ol',
          tags: ['Auth'],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    name: { type: 'string' },
                    email: { type: 'string', format: 'email' },
                    password: { type: 'string', minLength: 6 },
                    role: { type: 'string', enum: ['student', 'teacher', 'admin'] },
                    grade: { type: 'string' }
                  },
                  required: ['name', 'email', 'password']
                }
              }
            }
          },
          responses: {
            201: { description: 'Kayıt Başarılı' },
            400: { description: 'Geçersiz istek' }
          }
        }
      },
      '/api/auth/login': {
        post: {
          summary: 'Giriş Yap',
          tags: ['Auth'],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    email: { type: 'string', format: 'email' },
                    password: { type: 'string', minLength: 6 }
                  },
                  required: ['email', 'password']
                }
              }
            }
          },
          responses: {
            200: {
              description: 'Başarılı giriş',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      token: { type: 'string' },
                      user: {
                        type: 'object',
                        properties: {
                          id: { type: 'string' },
                          name: { type: 'string' },
                          email: { type: 'string' },
                          role: { type: 'string' }
                        }
                      }
                    }
                  }
                }
              }
            },
            400: { description: 'Geçersiz kimlik bilgileri' }
          }
        }
      }
    }
  },
  apis: [],
};

const swaggerSpec = swaggerJsdoc(options);
module.exports = swaggerSpec;
