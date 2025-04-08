import swaggerJSDoc from 'swagger-jsdoc';

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'L.I.F - Love Is Free API',
      version: '1.0.0',
      description: 'REST API for the Love Is Free dating app',
    },
    servers: [
      { url: 'http://localhost:5000/api', description: 'Development server' },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
      schemas: {
        ApiResponse: {
          type: 'object',
          properties: {
            statusCode: { type: 'integer' },
            success: { type: 'boolean' },
            message: { type: 'string' },
            data: { type: 'object' },
          },
        },
      },
    },
    security: [{ bearerAuth: [] }],
  },
  apis: ['./src/controllers/*.js'],
};

const swaggerSpec = swaggerJSDoc(options);

export default swaggerSpec;