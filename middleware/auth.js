const jwt = require('jsonwebtoken');

module.exports = function (req, res, next) {
  //retrieve the token from the header
  const token = req.header('x-auth-token');
  if (!token) {
    return res.status(401).json({ msg: 'No token, authorization denied' });
  }
  try {
    //decode the token using the secret. the token contains the user data
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    //set a user property in the req object for the next function to use.
    req.user = decoded.user;
    //call the next function
    next();
  } catch (err) {
    res.status(401).json({ msg: 'Token is not valid' });
  }
};
