/**
 * JWT Token Creation Test
 */

const jwt = require('jsonwebtoken');

const JWT_SECRET = 'change_this_secret';

const payload = {
  id: 4,
  role: 'teacher',
  subject: 'Computer Science'
};

console.log('Payload:', JSON.stringify(payload));

const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
console.log('Token:', token);

const decoded = jwt.verify(token, JWT_SECRET);
console.log('Decoded:', JSON.stringify(decoded, null, 2));

// Also test the token from auth controller format
const authPayload = {
  id: 4,
  role: 'teacher',
  subject: 'Computer Science'
};

const authToken = jwt.sign(authPayload, JWT_SECRET, { expiresIn: '7d' });
const authDecoded = jwt.verify(authToken, JWT_SECRET);

console.log('\n--- Auth Token Test ---');
console.log('Auth Payload:', JSON.stringify(authPayload));
console.log('Auth Decoded:', JSON.stringify(authDecoded, null, 2));
console.log('Auth Decoded Subject:', authDecoded.subject);
