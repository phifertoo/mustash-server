const express = require("express");
const router = express.Router();
require("dotenv").config();
const axios = require("axios");

// PUBLIC
// purpose: get geocode for mapquest API
//

router.get("/", async (req, res) => {
  const city = req.query.city;
  const state = req.query.state;
  try {
    //the middleware adds a property called user.id to the req object
    const geocode = await axios.get(process.env.MAPQUEST_URI, {
      params: { location: city + " " + state },
    });
    res.send(geocode.data.results[0].locations[0].latLng);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
});

module.exports = router;
