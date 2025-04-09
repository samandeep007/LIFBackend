import { gql } from 'apollo-server-express';

const typeDefs = gql`
  type User {
    id: ID!
    email: String!
    name: String!
    photoURL: String
    bio: String
    prompt: String
    preferences: String
    location: Location
    age: Int!
    gender: String!
    interests: [String]
    ethnicity: String
    education: String
    smoking: Boolean
    views: Int
    hiatus: Boolean
    verified: Boolean
    maybeLikes: [User]
    lastActive: String
    boostedUntil: String
  }

  type Location {
    type: String!
    coordinates: [Float]!
  }

  type Like {
    id: ID!
    liker: User!
    likee: User!
    isSuperLike: Boolean!
    createdAt: String!
  }

  type Message {
    id: ID!
    sender: User!
    receiver: User!
    text: String!
    mediaURL: String
    timestamp: String!
    read: Boolean!
    readAt: String
    isConfession: Boolean!
  }

  type Conversation {
    userId: ID!
    name: String!
    photoURL: String
    lastMessage: String!
    lastMediaURL: String
    timestamp: String!
    unreadCount: Int!
  }

  type Match {
    id: ID!
    users: [User!]!
    createdAt: String!
  }

  type Confession {
    id: ID!
    text: String!
    sender: User!
    timestamp: String!
  }

  type SafetyReport {
    id: ID!
    userId: User!
    reportedUserId: User!
    location: String
    reason: String!
    timestamp: String!
  }

  type Notification {
    id: ID!
    userId: ID!
    type: String!
    message: String!
    read: Boolean!
    createdAt: String!
  }

  type Call {
    id: ID!
    caller: User!
    receiver: User!
    status: String!
    type: String!
    startTime: String
    endTime: String
  }

  type Stats {
    views: Int
    likesGiven: Int
    likesReceived: Int
    superLikesGiven: Int
    matches: Int
    avgResponseTime: Float
    ghostedCount: Int
  }

  type UndoResponse {
    undoneUser: User
  }

  type ApiResponse {
    statusCode: Int!
    success: Boolean!
    message: String!
    data: JSON
  }

  type Query {
    profiles(lat: Float!, lng: Float!, maxDistance: Float, minAge: Int, maxAge: Int, gender: String, interests: String, preferences: String, ethnicity: String, education: String, smoking: Boolean): ApiResponse!
    stats: ApiResponse!
    conversation(userId: ID!): ApiResponse!
    inbox: ApiResponse!
    safetyGuidelines: ApiResponse!
    notifications(userId: ID!): ApiResponse!
    callHistory(userId: ID!): ApiResponse!
    maybeLikes: ApiResponse!
  }

  type Mutation {
    register(email: String!, password: String!, name: String!, phone: String!, prompt: String!, lat: Float!, lng: Float!, age: Int!, gender: String!, interests: String): ApiResponse!
    login(email: String!, password: String!): ApiResponse!
    verifyEmail(token: String!): ApiResponse!
    forgotPassword(email: String!): ApiResponse!
    resetPassword(token: String!, password: String!): ApiResponse!
    updateProfile(name: String, bio: String, prompt: String, lat: Float, lng: Float, age: Int, gender: String, interests: String, preferences: String, ethnicity: String, education: String, smoking: Boolean): ApiResponse!
    deleteProfile: ApiResponse!
    likeProfile(targetId: ID!, direction: String!): ApiResponse!
    undoLastSwipe: ApiResponse!
    toggleHiatus: ApiResponse!
    boostProfile: ApiResponse!
    sendMessage(receiverId: ID!, text: String, image: Upload): ApiResponse!
    sendConfession(text: String!): ApiResponse!
    deleteConversation(userId: ID!): ApiResponse!
    markMessagesRead(senderId: ID!): ApiResponse!
    reportSuspiciousActivity(reportedUserId: ID!, location: String, reason: String!): ApiResponse!
    verifyLocation(location: String!): ApiResponse!
    confirmIdentity: ApiResponse!
    markNotificationRead(id: ID!): ApiResponse!
    initiateCall(receiverId: ID!, type: String!): ApiResponse!
    acceptCall(callId: ID!): ApiResponse!
    rejectCall(callId: ID!): ApiResponse!
    endCall(callId: ID!): ApiResponse!
  }

  type Subscription {
    messageReceived(receiverId: ID!): Message!
    notificationReceived(userId: ID!): Notification!
    callInitiated(receiverId: ID!): Call!
    matchCreated: Match!
  }

  scalar JSON
  scalar Upload
`;

export default typeDefs;