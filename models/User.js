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
      deleted: { type: Boolean },
      messages: [
        {
          _id: { type: String, required: true },
          message: { type: String, required: true },
          sender: { type: String, required: true },
          recipient: { type: String, required: true },
        },
      ],
    },
  ],
});

module.exports = User = mongoose.model('user', UserSchema);
