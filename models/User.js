const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  city: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  date: { type: Date, default: Date.now },
  phone: { type: String, required: true },
  avatar: {
    URL: { type: String },
    key: { type: String },
  },
  conversations: [
    {
      _id: { type: String, required: true },
      messages: [
        {
          _id: { type: String, required: true },
          message: { type: String, required: true },
          sender: { type: String, required: true },
          senderName: { type: String },
          recipient: { type: String, required: true },
          recipientName: { type: String },
          read: { type: Boolean },
          date: {
            type: Date,
            default: Date.now,
          },
        },
      ],
    },
  ],
});

module.exports = User = mongoose.model('user', UserSchema);
