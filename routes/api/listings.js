const express = require("express");
const router = express.Router();
const auth = require("../../middleware/auth");
const Listing = require("../../models/Listings");
const formidable = require("formidable");
const fs = require("fs");
const axios = require("axios");
const AWS = require("aws-sdk");
const Busboy = require("busboy");

// PRIVATE
// purpose:list a storage space
// POST api/listing

router.post("/", auth, async (req, res) => {
  try {
    /*since we are sending a photo from the front end, we need to 
    accept form-data. The parse method allows us to recieve the strings
    as "fields" and the photos as "files"*/

    let form = new formidable.IncomingForm({ multiples: true });

    form.keepExtensions = true;
    form.parse(req, async (err, fields, files) => {
      if (err) {
        return res.status(400).json({
          error: "Image could not be uploaded",
        });
      }
      // input all the properties into an object
      const {
        addressString,
        typeString,
        content,
        frequencyString,
        accessString,
        price,
        description,
        title,
        length,
        width,
        height,
      } = fields;
      if (
        !addressString ||
        !typeString ||
        !content ||
        !frequencyString ||
        !accessString ||
        !price ||
        !description ||
        !title ||
        !length ||
        !width ||
        !height
      ) {
        return res.status(400).json({
          error: "All fields are required",
        });
      }
      const geocode = await axios.get(process.env.MAPQUEST_URI, {
        params: { location: addressString },
      });
      const { lat, lng } = geocode.data.results[0].locations[0].latLng;
      const user = req.user.user;
      const input = {
        user,
        addressString,
        typeString,
        size: { length, width, height },
        content,
        frequencyString,
        accessString,
        price,
        description,
        title,
        location: {
          type: "Point",
          //geoJSON in mongodb must be in lng, lat
          coordinates: [lng, lat],
        },
      };

      Object.keys(files).map((element) => {
        console.log(files[element]);
        const uploadToS3 = (file) => {
          let s3bucket = new AWS.S3({
            accessKeyId: process.env.AWS_ACCESS_KEY_ID,
            secretAccessKey: process.env.AWS_SECRET_KEY,
            Bucket: "mustash01",
          });
          s3bucket.createBucket(function () {
            const params = {
              Bucket: "mustash01",
              Key: element,
              Body: fs.readFileSync(files[element].path),
            };
            s3bucket.upload(params, function (err, data) {
              if (err) {
                console.log(err);
              }
              console.log(data);
            });
          });
        };
        const busboy = new Busboy({ headers: req.headers });
        busboy.on("finish", function () {
          uploadToS3(fs.readFileSync(files[element].path));
        });
        req.pipe(busboy);
      });

      const listing = new Listing(input);
      if (files) {
        // if (files.size > 1000000) {
        //   return res.status(400).json({
        //     error: "Image should be less than 1mb in size",
        //   });
        // }
        // Object.keys(files).map((element) => {
        //   let reader = new FileReader();
        //   reader.readAsDataURL(files[element]); // converts the blob to base64 and calls onload
        //   reader.onload = function () {
        //     listing.images[element] = fs.readFileSync(reader.result);
        //   };
        // });
        listing.images = {};
        Object.keys(files).map((element) => {
          //returns the contents at the blob path
          listing.images[element].data = fs.readFileSync(files[element].path);
          listing.images[element].contentType = files[element].type;
        });
      }
      listing.save((err, result) => {
        if (err) {
          return res.status(400).json({
            error: "database error",
          });
        }
        res.json(result);
      });
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
});

// PUBLIC
// purpose: return a group of listings based on the user's search
// GET api/listing/

router.get("/", async (req, res) => {
  const searchAddress = req.query.searchAddress;
  const searchRadius = req.query.searchRadius;
  try {
    const geocode = await axios.get(process.env.MAPQUEST_URI, {
      params: { location: searchAddress },
    });

    const { lng, lat } = geocode.data.results[0].locations[0].displayLatLng;
    const locations = await Listing.find({
      location: {
        $geoWithin: {
          /*the 2nd parameter is the radius of results from the point
          the area is expressed in radians of the earth (radius of the earth which is 3,963.2 miles)
          therefore, you need to take the number of miles and divide it by 3,963.2.*/
          $centerSphere: [[lng, lat], searchRadius / 3963.2],
        },
      },
      //return the results without the password
    }).select("-images");
    const response = {};
    response.locations = locations;
    response.center = { lat, lng };
    res.send(response);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
});

// PUBLIC
// purpose: return a group of listings based on the current location of the user
// GET api/listing/me

router.get("/me", async (req, res) => {
  try {
    //returns the location of the user
    const userLocation = await axios.get(process.env.GEOLOCATION_URI);
    const { longitude, latitude } = userLocation.data;

    const locations = await Listing.find({
      location: {
        $geoWithin: {
          /*the 2nd parameter is the radius of results from the point
          the area is expressed in radians of the earth (radius of the earth which is 3,963.2 miles)
          therefore, you need to take the number of miles and divide it by 3,963.2.*/
          $centerSphere: [[longitude, latitude], 5 / 3963.2],
        },
      },
      //return the results without the password
    }).select("-images");
    res.send(locations);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
});

// PUBLIC
// purpose: return images from search by id of the listings
// GET api/listing/images/:id

router.get("/images/:id", async (req, res) => {
  try {
    //returns the location of the user
    const listing = await Listing.findById(req.params.id);

    res.send(listing.images);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
});

module.exports = router;
