import axios from 'axios';

const initializeKhaltiPayment = async ({
  amount,
  purchase_order_id,
  purchase_order_name,
  return_url,
  website_url,
  user, // User info (payer)
}) => {
  try {
    // Validate inputs
    if (!return_url || return_url.includes('undefined')) {
      throw new Error('Invalid return_url: URL may be undefined');
    }
    if (!website_url) {
      throw new Error('website_url is required');
    }
    if (!amount || !purchase_order_id || !purchase_order_name) {
      throw new Error('Missing required fields: amount, purchase_order_id, or purchase_order_name');
    }
    if (!process.env.KHALTI_SECRET_KEY || !process.env.KHALTI_GATEWAY_URL) {
      throw new Error('KHALTI_SECRET_KEY or KHALTI_GATEWAY_URL is not set in environment variables');
    }

    // Prepare the payload with the logged-in user's info
    const payload = {
      amount: amount * 100, // Amount in paisa (e.g., 120000 paisa = NPR 1200)
      purchase_order_id,
      purchase_order_name,
      return_url, // e.g., http://localhost:8800/api/payment/complete-khalti-payment
      website_url, // e.g., http://localhost:8800
      // Customer info (payer) based on logged-in user
      customer_info: {
        name: user.name, // User's name (payer)
        email: user.email, // User's email (payer)
        phone: user.phone, // User's phone (payer)
      },
    };

    console.log('Khalti Payload:', payload); // Debug payload

    const response = await axios.post(
      `${process.env.KHALTI_GATEWAY_URL}epayment/initiate/`,
      payload,
      {
        headers: {
          Authorization: `Key ${process.env.KHALTI_SECRET_KEY}`,
          'Content-Type': 'application/json',
        },
      }
    );

    return response.data; // Returns { pidx, payment_url, ... }
  } catch (error) {
    console.error('Error initializing Khalti payment:', error.response?.data || error.message);
    throw new Error('Failed to initialize Khalti payment');
  }
};

const verifyKhaltiPayment = async (pidx) => {
  try {
    if (!pidx) {
      throw new Error('pidx is required for payment verification');
    }
    if (!process.env.KHALTI_SECRET_KEY || !process.env.KHALTI_GATEWAY_URL) {
      throw new Error('KHALTI_SECRET_KEY or KHALTI_GATEWAY_URL is not set in environment variables');
    }

    const response = await axios.post(
      `${process.env.KHALTI_GATEWAY_URL}epayment/lookup/`,
      { pidx },
      {
        headers: {
          Authorization: `Key ${process.env.KHALTI_SECRET_KEY}`,
          'Content-Type': 'application/json',
        },
      }
    );

    return response.data; // Returns payment details
  } catch (error) {
    console.error('Error verifying Khalti payment:', error.response?.data || error.message);
    throw new Error('Failed to verify Khalti payment');
  }
};

export default {
  initializeKhaltiPayment,
  verifyKhaltiPayment,
};
