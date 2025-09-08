// backend/src/services/monnifyService.js
import axios from "axios";

const MONNIFY_BASE_URL = process.env.MONNIFY_BASE_URL || "https://sandbox.monnify.com";
const MONNIFY_API_KEY = process.env.MONNIFY_API_KEY || "MK_TEST_KZZTS75189";
const MONNIFY_API_SECRET = process.env.MONNIFY_API_SECRET || "DBQ748K1U0VGEY57Q2UR663WDL7B8W3B";
const MONNIFY_CONTRACT_CODE = process.env.MONNIFY_CONTRACT_CODE || "1892165250";

// ✅ Authenticate and get access token
const authenticate = async () => {
  try {
    if (!MONNIFY_API_KEY || !MONNIFY_API_SECRET) {
      console.error("❌ Missing Monnify API Key/Secret");
      throw new Error("Missing Monnify credentials in environment variables");
    }

    console.log("🔑 Authenticating with Monnify...");
    const response = await axios.post(`${MONNIFY_BASE_URL}/api/v1/auth/login`, {}, {
      auth: {
        username: MONNIFY_API_KEY,
        password: MONNIFY_API_SECRET,
      },
    });

    console.log("✅ Monnify Auth Successful");
    return response.data.responseBody.accessToken;
  } catch (error) {
    console.error("❌ Monnify Authentication Error:", error.response?.data || error.message);
    throw new Error(error.response?.data?.responseMessage || "Failed to authenticate with Monnify");
  }
};

// ✅ Initialize a transaction
const initializeTransaction = async (data) => {
  try {
    console.log("🚀 Initializing Monnify transaction...");
    const token = await authenticate();

    // Always include contractCode
    const payload = { contractCode: MONNIFY_CONTRACT_CODE, ...data };
    console.log("📦 Monnify Payload:", payload);

    const response = await axios.post(
      `${MONNIFY_BASE_URL}/api/v1/merchant/transactions/init-transaction`,
      payload,
      { headers: { Authorization: `Bearer ${token}` } }
    );

    console.log("✅ Monnify Init Transaction Response:", response.data);
    return response.data;
  } catch (error) {
    const monnifyError = error.response?.data || { message: error.message };
    console.error("❌ Monnify Transaction Initialization Error:", monnifyError);

    throw new Error(
      monnifyError.responseMessage ||
      monnifyError.message ||
      "Failed to initialize transaction with Monnify"
    );
  }
};

// ✅ Verify transaction
const verifyTransaction = async (transactionReference) => {
  try {
    console.log(`🔎 Verifying Monnify transaction: ${transactionReference}`);
    const token = await authenticate();

    const response = await axios.get(
      `${MONNIFY_BASE_URL}/api/v1/merchant/transactions/query?transactionReference=${transactionReference}`,
      { headers: { Authorization: `Bearer ${token}` } }
    );

    console.log("✅ Monnify Verify Transaction Response:", response.data);
    return response.data;
  } catch (error) {
    const monnifyError = error.response?.data || { message: error.message };
    console.error("❌ Monnify Transaction Verification Error:", monnifyError);

    throw new Error(
      monnifyError.responseMessage ||
      monnifyError.message ||
      "Failed to verify transaction with Monnify"
    );
  }
};

export default { authenticate, initializeTransaction, verifyTransaction };
