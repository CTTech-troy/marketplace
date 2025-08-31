// src/services/monnifyService.js
const axios = require('axios');
const crypto = require('crypto');
const { apiKey, apiSecret, contractCode, baseUrl } = require('../config/monnify');

function generateSignature(apiKey, apiSecret, timestamp) {
  return crypto.createHmac('sha256', apiSecret)
    .update(apiKey + timestamp)
    .digest('hex');
}

async function getAuthToken() {
  const timestamp = Date.now().toString();
  const signature = generateSignature(apiKey, apiSecret, timestamp);

  const headers = {
    'Authorization': `Basic ${Buffer.from(apiKey + ':' + apiSecret).toString('base64')}`,
    'Timestamp': timestamp,
    'Signature': signature,
    'Content-Type': 'application/json'
  };

  try {
    const response = await axios.post(`${baseUrl}/auth/login`, {}, { headers });
    return response.data.responseBody.accessToken;
  } catch (error) {
    console.error('Monnify auth error:', error.response?.data || error.message);
    throw new Error('Monnify authentication failed');
  }
}

async function initiatePayment(payload) {
  const token = await getAuthToken();

  const headers = {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  };

  try {
    const response = await axios.post(`${baseUrl}/merchant/transactions/init-transaction`, payload, { headers });
    return response.data.responseBody;
  } catch (error) {
    console.error('Monnify payment initiation error:', error.response?.data || error.message);
    throw new Error('Payment initiation failed');
  }
}

module.exports = {
  initiatePayment
};
