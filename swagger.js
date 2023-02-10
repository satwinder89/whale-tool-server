const options = {
  swaggerDefinition: {
    openapi: '3.0.0',
    info: {
      title: 'My API',
      version: '1.0.0',
      description: 'A sample API',
    },
    // components: {
    //   securitySchemes: {
    //     bearerAuth: {
    //       type: 'http',
    //       scheme: 'bearer',
    //       bearerFormat: 'JWT',
    //     },
    //   },
    // },
    // security: [
    //   {
    //     bearerAuth: [],
    //   },
    // ],
    servers: [{ url: process.env.HOST + '/api' }],
  },
  apis: ['./routes/routes.js'],
}

module.exports = options
