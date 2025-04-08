import { app, httpServer } from './src/app.js';
import { winston } from './src/lib.js';

const PORT = process.env.PORT || 5000;
httpServer.listen(PORT, () => winston.info(`Server running on port ${PORT}, GraphQL at /graphql, Swagger at /api-docs`));