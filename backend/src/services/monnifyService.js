// src/services/monnifyService.js
import axios from 'axios';

const MONNIFY_BASE_URL = process.env.MONNIFY_BASE_URL || 'https://sandbox.monnify.com';
const MONNIFY_API_KEY = process.env.MONNIFY_API_KEY || '';
const MONNIFY_SECRET_KEY = process.env.MONNIFY_SECRET_KEY || '';

const authenticate = async () => {
  try {
    const response = await axios.post(`${MONNIFY_BASE_URL}/api/v1/auth/login`, {}, {
      auth: {
        username: MONNIFY_API_KEY,
        password: MONNIFY_SECRET_KEY,
      },
    });
    return response.data.responseBody.accessToken;
  } catch (error) {
    console.error('Monnify Authentication Error:', error.response?.data || error.message);
    throw new Error('Failed to authenticate with Monnify');
  }
};

const initializeTransaction = async (data) => {
  try {
    const token = await authenticate();
    const response = await axios.post(`${MONNIFY_BASE_URL}/api/v1/merchant/transactions/init-transaction`, data, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return response.data;
  } catch (error) {
    console.error('Monnify Transaction Initialization Error:', error.response?.data || error.message);
    throw new Error('Failed to initialize transaction with Monnify');
  }
};

const verifyTransaction = async (transactionReference) => {
  try {
    const token = await authenticate();
    const response = await axios.get(`${MONNIFY_BASE_URL}/api/v1/merchant/transactions/query?transactionReference=${transactionReference}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return response.data;
  } catch (error) {
    console.error('Monnify Transaction Verification Error:', error.response?.data || error.message);
    throw new Error('Failed to verify transaction with Monnify');
  }
};

export default {
  authenticate,
  initializeTransaction,
  verifyTransaction,
};
