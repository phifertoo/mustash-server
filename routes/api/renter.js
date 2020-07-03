const express = require('express');
const router = express.Router();
require('dotenv').config();
const auth = require('../../middleware/auth');
const Listing = require('../../models/Listings');

// PUBLIC
// purpose: get listings by renter
// GET api/renter/

router.get('/', auth, async (req, res) => {
  console.log(req.user);
  try {
    //the middleware adds a property called user.id to the req object
    const listings = await Listing.find({ renter: req.user.user });
    res.json(listings);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

module.exports = router;
