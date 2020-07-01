const express = require('express');
const router = express.Router();
const auth = require('../../middleware/auth');
const Listing = require('../../models/Listings');

// PRIVATE
// purpose: reserve spot
// POST api/reserve/

router.post('/', auth, async (req, res) => {
  try {
    const listing = await Listing.findOne({ _id: req.body.listing_id });
    listing.renter = req.user.user;
    listing.save((err, result) => {
      if (err) {
        console.log(err);
        return res.status(400).json({
          error: 'database error',
        });
      }
      res.json(result);
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

module.exports = router;
