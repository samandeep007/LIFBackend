# L.I.F - Love Is Free Backend

![Node.js](https://img.shields.io/badge/Node.js-v18.x-green)
![GraphQL](https://img.shields.io/badge/GraphQL-v16.x-purple)
![MongoDB](https://img.shields.io/badge/MongoDB-v6.x-blue)
![Swagger](https://img.shields.io/badge/Swagger-OpenAPI%203.0-brightgreen)

The backend for "L.I.F - Love Is Free" is a Node.js application built with Express, Apollo Server (GraphQL), MongoDB, Cloudinary, and Socket.IO. It provides a robust API for a dating app with advanced user filtering, location-based search, messaging with notifications, audio/video calling, safety features, and real-time subscriptions.

---

## Table of Contents
1. [Features](#features)
2. [Prerequisites](#prerequisites)
3. [Installation](#installation)
4. [Project Structure](#project-structure)
5. [Environment Variables](#environment-variables)
6. [Running the Application](#running-the-application)
7. [API Documentation](#api-documentation)
   - [Swagger UI](#swagger-ui)
   - [REST Endpoints](#rest-endpoints)
   - [GraphQL Queries](#graphql-queries)
   - [GraphQL Mutations](#graphql-mutations)
   - [GraphQL Subscriptions](#graphql-subscriptions)
8. [Error Handling](#error-handling)
9. [Response Format](#response-format)
10. [Dependencies](#dependencies)
11. [Contributing](#contributing)
12. [License](#license)

---

## Features
- **Core Features**:
  - Free messaging and photo viewing
  - Improved matchmaking with bio (100 chars) and prompt (50 chars)
  - Location-based search with customizable radius
  - Comprehensive filters: age, gender, interests, relationship preferences, ethnicity, education, smoking
  - Preferences: long-term, casual, intimacy
  - Confessions sent to random users
  - Auto-delete unread messages after 5 days
  - Ghosting stats and detailed user insights
  - Swipe up for "maybe" and undo last swipe
  - Hiatus mode to pause profile visibility
  - Update and delete user profiles
  - Real-time message notifications
  - Audio/video calling via WebRTC

- **Safety Features**:
  - Profile verification with simulated facial recognition
  - Safety guidelines for conversations
  - Location and identity verification
  - Report suspicious activity (3+ reports trigger hiatus)

- **Paid Features**:
  - Super Likes
  - Profile Boosts (24-hour visibility boost)
  - Enhanced visibility for boosted profiles

- **Technical Features**:
  - Dual API: REST (Swagger-documented) and GraphQL with real-time subscriptions
  - MongoDB with geospatial indexing for location queries
  - Cloudinary for photo storage with Multer for temp uploads
  - Socket.IO for WebRTC signaling and real-time updates
  - Standardized error and response handling
  - Rate limiting, CSRF protection, and security middleware

---

## Prerequisites
- **Node.js**: v18.x or higher
- **npm**: v9.x or higher
- **MongoDB**: Local instance or MongoDB Atlas (with geospatial support)
- **Cloudinary Account**: For photo storage
- **Git**: For version control

---

## Installation
1. **Clone the Repository**:
   ```bash
   git clone https://github.com/yourusername/LIFBackend.git
   cd LIFBackend
   ```

2. **Install Dependencies**:
   ```bash
   npm install
   ```

3. **Set Up Environment Variables**:
   Create a `.env` file in the root directory and configure it (see [Environment Variables](#environment-variables)).

4. **Create Temporary Storage**:
   ```bash
   mkdir -p public/temp
   ```

---

## Project Structure
```
LIFBackend/
├── src/
│   ├── controllers/         # Business logic for auth, users, messages, safety, notifications, calls
│   │   ├── authController.js
│   │   ├── userController.js
│   │   ├── messageController.js
│   │   ├── safetyController.js
│   │   ├── notificationController.js
│   │   ├── callController.js
│   ├── models/              # Mongoose schemas
│   │   ├── User.js
│   │   ├── Message.js
│   │   ├── Match.js
│   │   ├── Confession.js
│   │   ├── SafetyReport.js
│   │   ├── Notification.js
│   │   ├── Call.js
│   ├── middlewares/         # Express middleware
│   │   ├── authMiddleware.js
│   │   ├── validateInput.js
│   │   ├── rateLimitPerUser.js
│   ├── utils/               # Utility functions and classes
│   │   ├── cloudinary.js
│   │   ├── autoDelete.js
│   │   ├── logger.js
│   │   ├── apiError.js
│   │   ├── apiResponse.js
│   │   ├── asyncHandler.js
│   ├── graphql/             # GraphQL schema and resolvers
│   │   ├── schema.js
│   │   ├── resolvers.js
│   ├── lib.js               # Centralized imports/exports
│   ├── app.js               # Express and Apollo Server setup
│   ├── swagger.js           # Swagger configuration
├── public/
│   ├── temp/                # Temporary storage for Multer uploads
├── .env                     # Environment variables
├── index.js                 # Entry point
├── package.json             # Project metadata and dependencies
├── README.md                # This file
```

---

## Environment Variables
Create a `.env` file in the root directory with:
```
PORT=5000
MONGO_URI=mongodb://localhost:27017/LIFDB
JWT_SECRET=your-very-long-random-secret-key-32-chars-min
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret
CSRF_SECRET=your-csrf-secret-key
NODE_ENV=development
```

---

## Running the Application
1. **Start the Server**:
   ```bash
   npm start
   ```
   - Uses `nodemon` for auto-reloading in development.
   - Server runs at `http://localhost:5000`.
   - REST API base: `/api`
   - GraphQL: `/graphql`
   - WebSocket subscriptions: `ws://localhost:5000/graphql`
   - Swagger UI: `/api-docs`

2. **Test the API**:
   - Use Swagger UI at `http://localhost:5000/api-docs` for REST endpoints.
   - Use a GraphQL client (e.g., Postman, GraphiQL) for `/graphql`.

---

## API Documentation

### Swagger UI
Access at `http://localhost:5000/api-docs`.

### REST Endpoints
- **Auth**: Unchanged
- **Users**: Unchanged
- **Messages**: Unchanged
- **Safety**: Unchanged

### GraphQL Queries
- **notifications(userId)**: Retrieve user notifications.
  ```graphql
  query {
    notifications(userId: "user-id") {
      id
      type
      message
      read
      createdAt
    }
  }
  ```
- **callHistory(userId)**: Retrieve call history.
  ```graphql
  query {
    callHistory(userId: "user-id") {
      id
      caller { name }
      receiver { name }
      status
      type
      startTime
      endTime
    }
  }
  ```

### GraphQL Mutations
- **markNotificationRead(id)**: Mark a notification as read.
  ```graphql
  mutation {
    markNotificationRead(id: "notification-id") {
      statusCode
      success
      message
      data {
        id
        read
      }
    }
  }
  ```
- **initiateCall(receiverId, type)**: Start an audio/video call.
  ```graphql
  mutation {
    initiateCall(receiverId: "user-id", type: "video") {
      statusCode
      success
      message
      data {
        id
        caller { id }
        receiver { id }
        status
        type
      }
    }
  }
  ```
- **acceptCall(callId)**: Accept a call.
  ```graphql
  mutation {
    acceptCall(callId: "call-id") {
      statusCode
      success
      message
      data {
        id
        status
        startTime
      }
    }
  }
  ```
- **rejectCall(callId)**: Reject a call.
  ```graphql
  mutation {
    rejectCall(callId: "call-id") {
      statusCode
      success
      message
      data {
        id
        status
      }
    }
  }
  ```
- **endCall(callId)**: End a call.
  ```graphql
  mutation {
    endCall(callId: "call-id") {
      statusCode
      success
      message
      data {
        id
        status
        endTime
      }
    }
  }
  ```

### GraphQL Subscriptions
- **messageReceived(receiverId)**: Real-time message updates.
  ```graphql
  subscription {
    messageReceived(receiverId: "user-id") {
      id
      text
      sender { id }
      receiver { id }
    }
  }
  ```
- **notificationReceived(userId)**: Real-time notifications.
  ```graphql
  subscription {
    notificationReceived(userId: "user-id") {
      id
      type
      message
      read
      createdAt
    }
  }
  ```
- **callInitiated(receiverId)**: Real-time call initiation.
  ```graphql
  subscription {
    callInitiated(receiverId: "user-id") {
      id
      caller { id name }
      receiver { id name }
      status
      type
    }
  }
  ```

---

## Error Handling
- Uses `ApiError` class with `statusCode`, `status`, `message`, and `isOperational`.

---

## Response Format
```json
{
  "statusCode": Int,
  "success": Boolean,
  "message": String,
  "data": JSON
}
```

---

## Dependencies
- **Core**: `express`, `apollo-server-express`, `graphql`, `mongoose`, `socket.io`
- **Security**: `helmet`, `express-mongo-sanitize`, `csurf`, `express-rate-limit`
- **Utilities**: `jsonwebtoken`, `bcryptjs`, `dotenv`, `winston`
- **File Handling**: `multer`, `cloudinary`
- **Development**: `nodemon`
- **GraphQL Tools**: `@graphql-tools/schema`, `subscriptions-transport-ws`, `graphql-subscriptions`, `graphql-ws`
- **Swagger**: `swagger-jsdoc`, `swagger-ui-express`

---

## Contributing
1. Fork the repository.
2. Create a feature branch (`git checkout -b feature/your-feature`).
3. Commit changes (`git commit -m "Add your feature"`).
4. Push to the branch (`git push origin feature/your-feature`).
5. Open a pull request.

---

## License
This project is licensed under the MIT License.
