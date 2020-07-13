const express = require('express');
const router = express.Router();
const { check, validationResult } = require('express-validator');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../../models/User');
const formidable = require('formidable');
const fs = require('fs');
const AWS = require('aws-sdk');
AWS.config.update({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_KEY,
});
require('dotenv').config();

// route: POST http://localhost:5000/api/users
// description: register user
// access: public
router.post(
  '/',
  [
    check('firstName', 'First Name is Required').not().isEmpty(),
    check('lastName', 'Last Name is Required').not().isEmpty(),
    check('city', 'City is Required').not().isEmpty(),
    check('phone', 'Phone Number is Required').not().isEmpty(),
    check('email', 'Please include a valid email').isEmail(),
    check(
      'password',
      'Please enter a password with 6 or more characters'
    ).isLength({ min: 6 }),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    //create a user. Destructure the name, email, passwords properties fromthe body
    const { firstName, lastName, city, phone, email, password } = req.body;

    try {
      // see if user exists by email. If the findOne finds a match, it will return true
      let user = await User.findOne({ email });
      if (user) {
        return res
          .status(400)
          .json({ errors: [{ msg: 'User already exists' }] });
      }
      //create a new user
      user = new User({
        firstName,
        lastName,
        city,
        phone,
        email,
        password,
      });
      /* encrypt password. Create "salt" which is additional characters to the password to make it harder to crack.
        Then, add the salt to the password and "hash" the password+salt. Then save the password to mongoDB using the imported schema*/
      const salt = await bcrypt.genSalt(10);
      user.password = await bcrypt.hash(password, salt);
      //when you save, mongoDB returns
      await user.save();

      /* When you call .save(), if you do not pass in an _id property, mongoDB will automatically create a _id property. 
      Create a JWT token which will embed the secret and the payload.user._id */

      const payload = {
        user: {
          id: user._id,
        },
      };

      jwt.sign(
        payload,
        process.env.JWT_SECRET,
        { expiresIn: 360000000 },
        (err, token) => {
          if (err) throw err;
          res.json({ token, user });
        }
      );
    } catch (err) {
      console.log(err.message);
      res.status(500).send('Server error');
    }
  }
);

router.post(
  '/:user_id',
  [
    // check('firstName', 'First Name is Required').not().isEmpty(),
    // check('lastName', 'Last Name is Required').not().isEmpty(),
    // check('city', 'City is Required').not().isEmpty(),
    // check('phone', 'Phone Number is Required').not().isEmpty(),
    // check('email', 'Please include a valid email').isEmail(),
    // check(
    //   'password',
    //   'Please enter a password with 6 or more characters'
    // ).isLength({ min: 6 }),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      let form = new formidable.IncomingForm({ multiples: true });

      form.keepExtensions = true;
      form.parse(req, async (err, fields, files) => {
        if (err) {
          return res.status(400).json({
            error: 'Image could not be uploaded',
          });
        }

        const { firstName, lastName, email, password, city, phone } = fields;
        const input = { firstName, lastName, email, password, city, phone };

        const user = await User.findOne({ email });

        Object.keys(input).forEach((element) => {
          if (input[element] !== 'avatar' || input[element] !== 'password') {
            user[element] = input[element];
          }
        });

        //____________________________________________________________________upload images to s3____________________________
        if (Object.keys(files).length > 0) {
          const key =
            Math.random().toString(36).substring(2, 15) +
            Math.random().toString(36).substring(2, 15);
          const uploadToS3 = (file) => {
            const s3bucket = new AWS.S3({
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
              s3bucket.upload(params, (err, data) => {
                if (err) {
                  console.log(err);
                } else {
                  console.log(data);
                }
              });
            });
          };
          uploadToS3(fs.readFileSync(files.avatar.path));
          user.avatar = {
            URL: `https://mustash01.s3-us-west-1.amazonaws.com/${key}`,
            key,
          };
        }
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(password, salt);
        console.log(user);
        //____________________________________________________________________saving listing to mongoDB (includes image)____________________________
        user.save((err, result) => {
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
      console.log(err.message);
      res.status(500).send('Server error');
    }
  }
);

module.exports = router;
