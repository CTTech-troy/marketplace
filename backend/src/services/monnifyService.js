// backend/src/services/monnifyService.js
import axios from "axios";

const MONNIFY_BASE_URL = (process.env.MONNIFY_BASE_URL || "https://sandbox.monnify.com").replace(/\/+$/, "");
const MONNIFY_API_KEY = process.env.MONNIFY_API_KEY?.trim() || "";
const MONNIFY_API_SECRET = process.env.MONNIFY_API_SECRET?.trim() || "";
const MONNIFY_CONTRACT_CODE = process.env.MONNIFY_CONTRACT_CODE?.trim() || "";

const assertAuthConfig = () => {
  if (!MONNIFY_API_KEY || !MONNIFY_API_SECRET) {
    throw new Error("Monnify API credentials are not configured");
  }
};

const assertCheckoutConfig = () => {
  assertAuthConfig();
  if (!MONNIFY_CONTRACT_CODE) {
    throw new Error("Monnify contract code is not configured");
  }
};

const authenticate = async () => {
  assertAuthConfig();
  try {
    const response = await axios.post(
      `${MONNIFY_BASE_URL}/api/v1/auth/login`,
      {},
      { auth: { username: MONNIFY_API_KEY, password: MONNIFY_API_SECRET }, timeout: 12000 }
    );
    const token = response.data?.responseBody?.accessToken;
    if (typeof token !== "string" || !token) throw new Error("Invalid Monnify authentication response");
    return token;
  } catch {
    throw new Error("Failed to authenticate with Monnify");
  }
};

const initializeTransaction = async (data) => {
  assertCheckoutConfig();
  try {
    const token = await authenticate();
    const payload = { ...data, contractCode: MONNIFY_CONTRACT_CODE };
    const response = await axios.post(
      `${MONNIFY_BASE_URL}/api/v1/merchant/transactions/init-transaction`,
      payload,
      { headers: { Authorization: `Bearer ${token}` }, timeout: 15000 }
    );
    return response.data;
  } catch (error) {
    if (error instanceof Error && error.message.includes("not configured")) throw error;
    throw new Error("Failed to initialize transaction with Monnify");
  }
};

const verifyTransaction = async (transactionReference) => {
  assertAuthConfig();
  if (typeof transactionReference !== "string" || !transactionReference.trim()) {
    throw new Error("A valid transaction reference is required");
  }
  try {
    const token = await authenticate();
    const response = await axios.get(
      `${MONNIFY_BASE_URL}/api/v1/merchant/transactions/query`,
      {
        params: { transactionReference: transactionReference.trim() },
        headers: { Authorization: `Bearer ${token}` },
        timeout: 12000
      }
    );
    return response.data;
  } catch (error) {
    if (error instanceof Error && (error.message.includes("not configured") || error.message.includes("reference is required"))) throw error;
    throw new Error("Failed to verify transaction with Monnify");
  }
};

export default { authenticate, initializeTransaction, verifyTransaction };
