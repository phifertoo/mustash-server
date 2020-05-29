const express = require("express");
const router = express.Router();
const auth = require("../../middleware/auth");
const Listing = require("../../models/Listings");

// PUBLIC
// purpose:list a storage space
// POST api/storage

router.post("/", auth, async (req, res) => {
  try {
    const { address, description, title, photo } = req.body;
    const { street, city, state, zip } = address;
    const user = req.user.id;
    const fields = {
      user,
      description,
      title,
      photo,
      address: { street, city, state, zip },
    };
    const listing = new Listing(fields);
    //the middleware adds a property called user.id to the req object
    await listing.save();
    res.json(listing);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
});

module.exports = router;
