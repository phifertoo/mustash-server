const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
//auth is custom middleware that authenticates the jwt and adds an id to the req object
const auth = require('../../middleware/auth');
const User = require('../../models/User');
const { check } = require('express-validator');
const jwt = require('jsonwebtoken');

// GET api/auth
// PUBLIC
// authenticate user

router.get('/', auth, async (req, res) => {
  try {
    //the middleware adds a property called user.id to the req object
    const user = await User.findById(req.user.id).select('-password');
    res.json(user);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// POST api/auth
// PUBLIC
// sign in
// response: send token to client

router.post(
  '/',
  [
    check('email', 'Please include a valid email').isEmail(),
    check('password', 'Password is required').exists(),
  ],
  async (req, res) => {
    try {
      const { email, password } = req.body;
      const user = await User.findOne({ email });
      const storedPassword = user.password;
      //check if user exists
      if (!user) {
        return res.status(400).json({ msg: 'Invalid credentials' });
      }
      //check if password matches
      const isMatch = bcrypt.compare(password, storedPassword);
      //if passwords match, create a jwt and send the jwt
      if (!isMatch) {
        return res.status(400).json({ msg: 'Invalid password' });
      }
      const payload = {
        user: {
          user: user.id,
        },
      };
      //create a jwt and send it back. We pass the user as the payload
      const token = jwt.sign(payload, process.env.JWT_SECRET, {
        expiresIn: 100000,
      });
      res.json({ token });
    } catch (err) {
      console.log(err);
    }
  }
);

module.exports = router;
