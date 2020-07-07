const express = require('express');
const router = express.Router();
const auth = require('../../middleware/auth');
const Listing = require('../../models/Listings');

// PRIVATE
// purpose: add a rating to a listing
// POST api/ratings/:listing_Id

router.post('/:listing_id', auth, async (req, res) => {
  try {
    const rating = {
      rating: req.body.rating,
      renter: req.user.user,
    };
    listing_id = req.params.listing_id;
    let existingListing = await Listing.findOne({ _id: listing_id });

    if (existingListing) {
      existingListing.ratings.push(rating);
      existingListing.save(async (err, result) => {
        if (err) {
          return res.status(400).json({
            error: 'database error',
          });
        }
        const myRentals = await Listing.find({ renter: req.user.user });
        const input = {
          myRentals,
          result,
        };
        res.json(input);
      });
    }
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// PRIVATE
// purpose: update a rating to a listing
// POST api/ratings/:listing_Id/:rating_id

router.post('/:listing_id/:rating_id', auth, async (req, res) => {
  try {
    const rating = req.body.rating;
    const listing_id = req.params.listing_id;
    const rating_id = req.params.rating_id;
    let existingListing = await Listing.findOne({ _id: listing_id });
    const ratings = existingListing.ratings;

    if (existingListing) {
      const index = ratings.findIndex((element) => element._id === rating_id);
      ratings.splice(index, 1);
      ratings.push(rating);

      existingListing.save((err, result) => {
        if (err) {
          return res.status(400).json({
            error: 'database error',
          });
        }
        res.json(result);
      });
    }
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// PRIVATE
// purpose: add a rating to a listing
// POST api/ratings/:listing_Id/:rating_id

router.delete('/:listing_id/:rating_id', auth, async (req, res) => {
  try {
    const listing_id = req.params.listing_id;
    const rating_id = req.params.rating_id;
    let existingListing = await Listing.findOne({ _id: listing_id });
    const ratings = existingListing.ratings;

    if (existingListing) {
      const index = ratings.findIndex((element) => element._id === rating_id);
      ratings.splice(index, 1);

      existingListing.save((err, result) => {
        if (err) {
          return res.status(400).json({
            error: 'database error',
          });
        }
        res.json(result);
      });
    }
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

module.exports = router;
