import swaggerJsdoc from 'swagger-jsdoc'

const options = {
  // 'definition' es requerido por swagger-jsdoc.
  // Actúa como la base de la especificación.
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'SocketLink API', // Este título será sobrescrito por swagger.yml
      version: '1.0.0',      // Esta versión también será sobrescrita
    },
  },
  // Se le indica a swagger-jsdoc que procese todos los archivos YAML.
  // 1. swagger.yml: Aporta la información base (info, servers).
  // 2. components.yml: Aporta todos los componentes reusables.
  // 3. paths/**/*.yml: Aporta todos los endpoints.
  apis: ['src/swagger/swagger.yml', 'src/swagger/components.yml', 'src/swagger/paths/**/*.yml'],
};

const swaggerSpec = swaggerJsdoc(options);

export default swaggerSpec
