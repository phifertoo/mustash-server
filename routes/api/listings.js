const express = require('express');
const router = express.Router();
const auth = require('../../middleware/auth');
const Listing = require('../../models/Listings');
const formidable = require('formidable');
const fs = require('fs');
const axios = require('axios');
const AWS = require('aws-sdk');

// PRIVATE
// purpose:list a storage space
// POST api/listing

router.post('/', auth, async (req, res) => {
  try {
    /*since we are sending a photo from the front end, we need to 
    accept form-data. The parse method allows us to recieve the strings
    as "fields" and the photos as "files"*/

    let form = new formidable.IncomingForm({ multiples: true });

    form.keepExtensions = true;
    form.parse(req, async (err, fields, files) => {
      if (err) {
        return res.status(400).json({
          error: 'Image could not be uploaded',
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
          error: 'All fields are required',
        });
      }
      const geocode = await axios.get(process.env.MAPQUEST_URI, {
        params: { location: addressString },
      });
      const { lat, lng } = geocode.data.results[0].locations[0].latLng;
      const user = req.user.user;
      const input = {
        seller: user,
        renter: '',
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
          type: 'Point',
          //geoJSON in mongodb must be in lng, lat
          coordinates: [lng, lat],
        },
      };

      let s3Images = {};

      //____________________________________________________________________upload images to s3____________________________
      if (files) {
        let key = 0;

        Object.keys(files).map((element) => {
          key =
            Math.random().toString(36).substring(2, 15) +
            Math.random().toString(36).substring(2, 15);
          const uploadToS3 = (file) => {
            let s3bucket = new AWS.S3({
              accessKeyId: process.env.AWS_ACCESS_KEY_ID,
              secretAccessKey: process.env.AWS_SECRET_KEY,
              Bucket: 'mustash01',
            });
            s3bucket.createBucket(() => {
              const params = {
                Bucket: 'mustash01',
                Key: key,
                ContentType: 'image/jpeg',
                ACL: 'public-read',
                Body: file,
              };
              output = s3bucket.upload(params, (err, data) => {
                if (err) {
                  console.log(err);
                } else {
                  console.log(data);
                }
              });
            });
          };
          uploadToS3(fs.readFileSync(files[element].path));
          s3Images[element] = {};
          s3Images[
            element
          ].url = `https://mustash01.s3-us-west-1.amazonaws.com/${key}`;
          s3Images[element].name = key;
        });
      }

      //____________________________________________________________________saving listing to mongoDB (includes image)____________________________

      const listing = new Listing(input);
      if (files) {
        // if (files.size > 1000000) {
        //   return res.status(400).json({
        //     error: "Image should be less than 1mb in size",
        //   });
        // }
        Object.keys(files).map((element) => {
          //returns the contents at the blob path
          listing.images[element].data = fs.readFileSync(files[element].path);
          listing.images[element].contentType = files[element].type;
        });
      }
      //add image paths from S3 to the listing
      listing.s3Images = s3Images;
      listing.save((err, result) => {
        if (err) {
          console.log(err);
          return res.status(400).json({
            error: 'database error',
          });
        }
        res.json(result);
      });
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// PUBLIC
// purpose: return a group of listings based on the user's search
// GET api/listing/

router.get('/', async (req, res) => {
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
    }).select('-images');
    const response = {};
    response.locations = locations;
    response.center = { lat, lng };
    res.send(response);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// PUBLIC
// purpose: return a group of listings based on the current location of the user
// GET api/listing/me

router.get('/me', async (req, res) => {
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
    }).select('-images');
    res.send(locations);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// PUBLIC
// purpose: return images from search by id of the listings
// GET api/listing/images/:id

// router.get("/images/:id", async (req, res) => {
//   try {
//     //returns the location of the user
//     const listing = await Listing.findById(req.params.id);

//     res.send(listing.images);
//   } catch (err) {
//     console.error(err.message);
//     res.status(500).send("Server Error");
//   }
// });

// PRVATE
// purpose: update listing
// POST api/listing/update

router.post('/update', auth, async (req, res) => {
  try {
    const {
      _id,
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
    } = req.body;

    const properties = {
      addressString,
      typeString,
      size: { length, width, height },
      content,
      frequencyString,
      accessString,
      price,
      description,
      title,
    };

    let existingListing = await Listing.findOne({ _id });
    //____________________________________________________________________saving listing to mongoDB (includes image)____________________________
    if (existingListing) {
      existingListing = await Listing.findOneAndUpdate(
        { _id },
        {
          $set: properties,
        },
        { new: true }
      );
    }
    //add image paths from S3 to the listing
    return res.json(existingListing);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// PRVATE
// purpose: delete listing
// DELETE api/listing

router.delete('/', auth, async (req, res) => {
  const _id = req._id;
  try {
    await Listing.findOneAndRemove({ _id });
    //remove user
    res.send({ msg: 'Listing deleted' });
  } catch (err) {
    res.status(500).send('Server Error');
  }
});

// PRVATE
// purpose: delete image
// DELETE api/listing/image

router.delete('/image', auth, async (req, res) => {
  try {
    const { _id, name } = req.body;

    let existingListing = await Listing.findOne({ _id });
    const existingS3Images = existingListing.s3Images;
    //____________________________________________________________________saving listing to mongoDB (includes image)____________________________
    if (existingListing) {
      Object.keys(existingS3Images).forEach((element) => {
        if (existingS3Images[element].name === name) {
          existingListing.s3Images[element] = undefined;
        }
      });
    }

    existingListing.save((err, result) => {
      if (err) {
        return res.status(400).json({
          error: 'database error',
        });
      }
      res.json(result);
    });
    //add image paths from S3 to the listing
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// PRVATE
// purpose: add image
// POST api/listing/image

router.post('/image', auth, async (req, res) => {
  let existingListing = {};
  try {
    let form = new formidable.IncomingForm({ multiples: true });

    form.keepExtensions = true;
    form.parse(req, async (err, fields, files) => {
      if (err) {
        return res.status(400).json({
          error: 'Image could not be uploaded',
        });
      }

      if (files) {
        const _id = fields._id;
        existingListing = await Listing.findOne({ _id });

        let availableKey = 0;
        let keyNumber = 1;
        let keyFound = false;

        while (keyFound === false) {
          if (
            existingListing.s3Images[`image${keyNumber}`].name === undefined
          ) {
            keyFound = true;
            availableKey = keyNumber;
          }
          keyNumber++;
        }

        const key =
          Math.random().toString(36).substring(2, 15) +
          Math.random().toString(36).substring(2, 15);
        const uploadToS3 = (file) => {
          let s3bucket = new AWS.S3({
            accessKeyId: process.env.AWS_ACCESS_KEY_ID,
            secretAccessKey: process.env.AWS_SECRET_KEY,
            Bucket: 'mustash01',
          });
          s3bucket.createBucket(() => {
            const params = {
              Bucket: 'mustash01',
              Key: key,
              ContentType: 'image/jpeg',
              ACL: 'public-read',
              Body: file,
            };
            output = s3bucket.upload(params, (err, data) => {
              if (err) {
                console.log(err);
              } else {
                console.log(data);
              }
            });
          });
        };
        uploadToS3(fs.readFileSync(files.newImage.path));
        existingListing.s3Images[`image${availableKey}`] = '';
        existingListing.s3Images[
          `image${availableKey}`
        ].url = `https://mustash01.s3-us-west-1.amazonaws.com/${key}`;
        existingListing.s3Images[`image${availableKey}`].name = key;
      }

      existingListing.save((err, result) => {
        if (err) {
          return res.status(400).json({
            error: 'database error',
          });
        }
        res.json(result);
      });
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// PRVATE
// purpose: add image
// POST api/listing/:seller_id

router.get('/:seller_id', auth, async (req, res) => {
  try {
    const listings = await Listing.find({ seller: req.params.seller_id });
    res.json(listings);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

module.exports = router;
