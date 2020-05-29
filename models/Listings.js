const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    // tells mongoose to use the User model
    ref: "user",
  },
  address: {
    street: { type: String, required: true },
    city: { type: String, required: true },
    state: { type: String, required: true },
    zip: { type: Number, required: true },
  },
  description: { type: String, required: true },
  title: { type: String, required: true },
  photo: { type: Buffer, contentType: String },
});

module.exports = Listings = mongoose.model("listings", UserSchema);
