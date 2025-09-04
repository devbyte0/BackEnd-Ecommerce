const mongoose = require('mongoose');
const ChatRoom = require('../models/ChatRoom');

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/ecommerce', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

async function fixDuplicateIds() {
  try {
    console.log('🔧 Starting to fix duplicate _id issues...');
    
    const rooms = await ChatRoom.find({});
    console.log(`Found ${rooms.length} chat rooms to process`);
    
    for (const room of rooms) {
      let hasChanges = false;
      
      // Fix messages with duplicate _id fields
      if (room.messages && room.messages.length > 0) {
        const fixedMessages = room.messages.map((msg, index) => {
          // If message has duplicate _id fields, fix it
          if (msg._id && typeof msg._id === 'object' && msg._id._id) {
            console.log(`Fixing duplicate _id in room ${room._id}, message ${index}`);
            hasChanges = true;
            return {
              ...msg,
              _id: msg._id._id || new mongoose.Types.ObjectId(),
              // Remove duplicate _id field
              ...Object.fromEntries(
                Object.entries(msg).filter(([key]) => key !== '_id' || typeof msg[key] !== 'object')
              )
            };
          }
          return msg;
        });
        
        if (hasChanges) {
          room.messages = fixedMessages;
          await room.save();
          console.log(`✅ Fixed room ${room._id}`);
        }
      }
    }
    
    console.log('🎉 Finished fixing duplicate _id issues!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error fixing duplicate _id issues:', error);
    process.exit(1);
  }
}

// Run the fix
fixDuplicateIds();
