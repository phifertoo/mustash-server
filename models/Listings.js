const mongoose = require('mongoose');

const ListingsSchema = new mongoose.Schema({
  // user: {
  //   type: mongoose.Schema.Types.ObjectId,
  //   // tells mongoose to use the User model
  //   ref: "user",
  // },
  seller: {
    type: mongoose.Schema.Types.ObjectId,
    // tells mongoose to use the User model
    ref: 'user',
  },
  renter: { type: String },
  typeString: { type: String, required: true },
  size: {
    length: { type: String, required: true },
    width: { type: String, required: true },
    height: { type: String, required: true },
  },
  addressString: { type: String, required: true },
  content: { type: [String], required: true },
  frequencyString: { type: String, required: true },
  accessString: { type: String, required: true },
  title: { type: String, required: true },
  description: { type: String, required: true },
  price: { type: Number, required: true },
  location: {
    type: {
      type: String, // Don't do `{ location: { type: String } }`
      enum: ['Point'], // 'location.type' must be 'Point'
      required: true,
    },
    coordinates: {
      type: [Number],
      required: true,
    },
  },
  images: {
    image1: { data: Buffer, contentType: String },
    image2: { data: Buffer, contentType: String },
    image3: { data: Buffer, contentType: String },
    image4: { data: Buffer, contentType: String },
    image5: { data: Buffer, contentType: String },
  },
  s3Images: {
    image1: {
      name: { type: String },
      url: { type: String },
    },
    image2: {
      name: { type: String },
      url: { type: String },
    },
    image3: {
      name: { type: String },
      url: { type: String },
    },
    image4: {
      name: { type: String },
      url: { type: String },
    },
    image5: {
      name: { type: String },
      url: { type: String },
    },
  },
  imageArray: {
    type: [
      {
        name: { type: String },
        url: { type: String },
      },
    ],
  },
  ratings: [
    {
      renter: {
        type: String,
      },
      rating: {
        type: Number,
      },
      date: {
        type: Date,
        default: Date.now,
      },
    },
  ],
  comments: [
    {
      renter: {
        type: String,
      },
      comment: {
        type: String,
      },
      date: {
        type: Date,
        default: Date.now,
      },
    },
  ],
});

// create the geolocation indexing in mongodb
// https://medium.com/@galford151/mongoose-geospatial-queries-with-near-59800b79c0f6
ListingsSchema.index({ location: '2dsphere' });

module.exports = Listings = mongoose.model('listings', ListingsSchema);
