// src/config/monnify.js
module.exports = {
  apiKey: process.env.MONNIFY_API_KEY,
  apiSecret: process.env.MONNIFY_API_SECRET,
  contractCode: process.env.MONNIFY_CONTRACT_CODE,
  baseUrl: 'https://sandbox.monnify.com/api/v1' // Use production URL in prod
};