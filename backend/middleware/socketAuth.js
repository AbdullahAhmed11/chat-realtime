// socketAuth.js
const jwt = require('jsonwebtoken');

const verifyTokenSocket = (token) => {
  if (!token) throw new Error('No token');
  return jwt.verify(token, process.env.JWT_SECRET);
};

module.exports = { verifyTokenSocket };
