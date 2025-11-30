import swaggerJsdoc from 'swagger-jsdoc'

const options = {
	definition: {
		openapi: '3.0.0',
		info: {
			title: 'API REST',
			version: '1.0.0',
			description: 'Documentación de la API REST',
		},
		servers: [{ url: 'http://localhost:3000' }],
	},
	apis: ['./src/api/*.ts'],
};

const swaggerSpec = swaggerJsdoc(options);

export default swaggerSpec
