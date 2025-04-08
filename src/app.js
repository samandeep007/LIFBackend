import express from 'express';
import { ApolloServer } from 'apollo-server-express';
import { createServer } from 'http';
import { makeExecutableSchema } from '@graphql-tools/schema';
import { WebSocketServer } from 'ws';
import { useServer } from 'graphql-ws/lib/use/ws';
import helmet from 'helmet';
import mongoSanitize from 'express-mongo-sanitize';
import csurf from 'csurf';
import cors from 'cors';
import dotenv from 'dotenv';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import {
  mongoose, startAutoDelete, rateLimitPerUser, winston, swaggerUi, swaggerSpec,
  authController, userController, messageController, safetyController, authMiddleware,
} from './lib.js';
import typeDefs from './graphql/schema.js';
import resolvers from './graphql/resolvers.js';

dotenv.config({ path: '../.env' });

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, path.join(__dirname, '../public/temp')),
  filename: (req, file, cb) => cb(null, `${Date.now()}-${file.originalname}`),
});
const upload = multer({ storage });

app.use(helmet({ contentSecurityPolicy: process.env.NODE_ENV === 'production' }));
app.use(cors({ origin: process.env.NODE_ENV === 'production' ? 'https://your-frontend.com' : '*', credentials: true }));
app.use(express.json());
app.use(mongoSanitize());
app.use(rateLimitPerUser);
const csrfProtection = csurf({ cookie: { httpOnly: true, secure: process.env.NODE_ENV === 'production' } });
app.use(csrfProtection);

mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => winston.info('MongoDB connected'))
  .catch(err => winston.error(`MongoDB connection failed: ${err.message}`));

app.post('/api/auth/register', upload.single('photo'), authController.register);
app.post('/api/auth/login', authController.login);

app.get('/api/users/profiles', authMiddleware, userController.getProfiles);
app.put('/api/users/profile', upload.single('photo'), authMiddleware, userController.updateProfile);
app.delete('/api/users/profile', authMiddleware, userController.deleteProfile);
app.post('/api/users/swipe', authMiddleware, userController.swipe);
app.get('/api/users/stats', authMiddleware, userController.getStats);
app.post('/api/users/undo', authMiddleware, userController.undoSwipe);
app.post('/api/users/hiatus', authMiddleware, userController.toggleHiatus);
app.post('/api/users/superlike', authMiddleware, userController.superLike);
app.post('/api/users/boost', authMiddleware, userController.boostProfile);

app.post('/api/messages', authMiddleware, messageController.sendMessage);
app.get('/api/messages/conversation/:userId', authMiddleware, messageController.getConversation);
app.post('/api/messages/confession', authMiddleware, messageController.sendConfession);
app.get('/api/messages/safety-guidelines', messageController.getSafetyGuidelines);

app.post('/api/safety/report', authMiddleware, safetyController.reportSuspiciousActivity);
app.post('/api/safety/verify-location', authMiddleware, safetyController.verifyLocation);
app.post('/api/safety/confirm-identity', upload.single('photo'), authMiddleware, safetyController.confirmIdentity);

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

const schema = makeExecutableSchema({ typeDefs, resolvers });
const server = new ApolloServer({
  schema,
  context: ({ req }) => ({ req }),
  introspection: process.env.NODE_ENV !== 'production',
  playground: process.env.NODE_ENV !== 'production',
});
await server.start();
server.applyMiddleware({ app, path: '/graphql' });

const httpServer = createServer(app);
const wsServer = new WebSocketServer({ server: httpServer, path: '/graphql' });
useServer({ schema }, wsServer);

startAutoDelete();

app.get('/csrf-token', (req, res) => {
  res.json({ csrfToken: req.csrfToken() });
});

export { app, httpServer };