// src/config/monnify.js

// Use environment variables for security
const monnifyConfig = {
  apiKey: process.env.MONNIFY_API_KEY,        
  apiSecret: process.env.MONNIFY_API_SECRET,  
  contractCode: process.env.MONNIFY_CONTRACT_CODE, 
  baseUrl: process.env.NODE_ENV === "production"
    ? "https://api.monnify.com/api/v1"       
    : "https://sandbox.monnify.com/api/v1"   
};

export default monnifyConfig;
