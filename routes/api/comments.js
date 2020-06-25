const express = require('express');
const router = express.Router();
const auth = require('../../middleware/auth');
const Listing = require('../../models/Listings');

// PRIVATE
// purpose: add a comment to a listing
// POST api/comments/:commend_id

router.post('/:listing_id', auth, async (req, res) => {
  try {
    const comment = req.body.comment;
    listing_id = req.params.listing_id;
    let existingListing = await Listing.findOne({ _id: listing_id });
    if (existingListing) {
      existingListing.comments.push(comment);
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
// purpose: add a cmment to a listing
// POST api/comments/:listing_Id/:comment_id

router.post('/:listing_id/:comment_id', auth, async (req, res) => {
  try {
    const comment = req.body.comment;
    const listing_id = req.params.listing_id;
    const comment_id = req.params.comment_id;
    let existingListing = await Listing.findOne({ _id: listing_id });
    const comments = existingListing.comments;

    if (existingListing) {
      const index = comments.findIndex((element) => element._id === comment_id);
      comments.splice(index, 1);
      comments.push(comment);

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
// purpose: add a comment to a listing
// POST api/comments/:listing_Id/:comment_id

router.delete('/:listing_id/:comment_id', auth, async (req, res) => {
  try {
    const listing_id = req.params.listing_id;
    const comment_id = req.params.comment_id;
    let existingListing = await Listing.findOne({ _id: listing_id });
    const comments = existingListing.comments;

    if (existingListing) {
      const index = comments.findIndex((element) => element._id === comment_id);
      comments.splice(index, 1);

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
