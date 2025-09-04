# Chat System Fixes and Features

## Overview

This document outlines the fixes and features implemented for the chat system, including user chat drawer, admin chat list, admin message page, and backend API routes.

## Backend Setup

### 1. Socket.IO Integration

- Socket.IO instance is set in Express app: `app.set('socketio', io)`
- Accessed in controllers via: `req.app.get('socketio')`

### 2. API Endpoints

#### User Routes

- `GET /api/user/rooms/:customerId` - Get or create chat room
- `POST /api/user/rooms/:roomId/message` - Send message
- `POST /api/user/rooms/:roomId/messages/:messageId/reaction` - Add reaction
- `POST /api/user/rooms/:roomId/read` - Mark messages as read
- `POST /api/user/rooms/:roomId/online` - Update online status

#### Admin Routes

- `POST /api/rooms/auto-assign` - Auto-assign admin to unassigned room
- `POST /api/rooms/:roomId/transfer` - Transfer room to another admin
- `POST /api/rooms/:roomId/close` - Close chat room
- `POST /api/rooms/:roomId/message` - Send message
- `POST /api/rooms/:roomId/read` - Mark messages as read
- `POST /api/rooms/:roomId/online` - Update online status
- `GET /api/rooms` - Get all chat rooms
- `GET /api/rooms/:roomId` - Get specific chat room

### 3. Database Schema Updates

#### Message Schema

```javascript
{
  senderId: ObjectId,
  senderType: "customer" | "admin",
  text: String,
  reaction: String,
  reactedBy: ObjectId,
  readBy: [{
    readerType: "customer" | "admin",
    readerId: ObjectId,
    readAt: Date
  }],
  createdAt: Date
}
```

#### ChatRoom Schema

```javascript
{
  customerId: ObjectId,
  participants: [ObjectId],
  assignedAdmin: ObjectId,
  isClosed: Boolean,
  closedBy: ObjectId,
  closedAt: Date,
  messages: [MessageSchema],
  timestamps: true
}
```

## Frontend Setup

### 1. Environment Variables

Create `.env` file in frontend root:

```env
VITE_API_URI=http://localhost:5000
```

### 2. Context Providers

- `UserChatProvider` - Manages user chat state and Socket.IO connection
- `AdminChatProvider` - Manages admin chat state and Socket.IO connection

### 3. Components

- `ChatDrawer` - User-facing chat interface
- `ChatList` - Admin chat room list
- `MessagePage` - Admin detailed chat view
- `ChatItem` - Individual chat room item

## New Features Added

### 1. Browser Notifications

- **User Chat**: Shows notifications when new messages arrive and chat is closed
- **Admin Chat**: Shows notifications for new customer messages
- **Permission Request**: Automatically requests notification permission on first load
- **Custom Titles**: Shows sender name in notification title

### 2. Specific Read Status

- **Detailed Tracking**: Each message tracks who read it and when
- **Visual Indicators**: Single checkmark (sent) vs double checkmark (read)
- **Read Timestamps**: Shows exact time when message was read
- **Real-time Updates**: Read status updates instantly via Socket.IO

### 3. Auto-Assignment System

- **Auto-Assign Button**: Admins can click to assign unassigned rooms to themselves
- **Welcome Message**: Automatically sends personalized welcome message when admin joins
- **Real-time Updates**: Room assignment updates instantly for all participants
- **Smart Assignment**: Finds first available unassigned room

### 4. Admin Name Display

- **User Chat Header**: Shows assigned admin's name instead of generic "Customer Support"
- **Online Status**: Shows admin's online/offline status in user chat
- **Personalized Messages**: Welcome message includes admin's name
- **Real-time Updates**: Admin name updates when room is transferred

### 5. Enhanced Online Status

- **Socket-Based**: Online status managed via Socket.IO instead of database
- **Real-time Updates**: Status changes broadcast instantly
- **Visual Indicators**: Green dot for online status
- **Automatic Cleanup**: Status cleared when user disconnects

### 6. Improved Read Receipts

- **Specific Tracking**: Knows exactly who read each message
- **Timestamp Display**: Shows when message was read
- **Visual Feedback**: Different colors for sent vs read messages
- **Real-time Updates**: Receipts update instantly

## Socket.IO Events

### Emitted Events

- `messageReceived` - New message sent
- `messagesRead` - Messages marked as read
- `onlineStatusChanged` - User online status changed
- `roomAssigned` - Room assigned to admin
- `roomTransferred` - Room transferred to different admin
- `roomClosed` - Room closed by admin
- `newChatRoom` - New chat room created

### Listened Events

- `joinChatRoom` - Join specific chat room
- `joinUserRoom` - Join user's personal room
- `joinAdminRoom` - Join admin broadcast room
- `sendMessage` - Send message via socket

## Troubleshooting

### Token Issues

1. Check localStorage for correct token key
2. Verify token format and expiration
3. Clear invalid tokens and re-login
4. Check API_URI configuration

### Socket Connection Issues

1. Verify Socket.IO server is running
2. Check authentication token in socket connection
3. Ensure proper room joining
4. Check network connectivity

### Read Status Issues

1. Verify message structure includes readBy array
2. Check readerType and readerId values
3. Ensure proper socket event emission
4. Verify frontend state updates

### Auto-Assignment Issues

1. Check admin authentication
2. Verify unassigned room availability
3. Ensure proper welcome message creation
4. Check socket event emission

## Performance Optimizations

### Frontend

- `React.useCallback` for memoized functions
- Conditional rendering for notifications
- Efficient state updates
- Optimized re-renders

### Backend

- Efficient database queries with populate
- Socket.IO room management
- Proper error handling
- Memory-efficient message storage

## Security Considerations

### Authentication

- JWT token validation
- Admin vs user role separation
- Secure socket connections
- Token refresh handling

### Data Validation

- Input sanitization
- Message length limits
- User permission checks
- Room access validation

## Future Enhancements

### Planned Features

- Message reactions with emojis
- File/image sharing
- Typing indicators
- Message search functionality
- Chat room archiving
- Advanced admin dashboard
- Customer satisfaction ratings
- Automated responses
- Chat analytics and reporting
