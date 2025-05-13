import axios from 'axios';
import { v4 as uuidv4 } from 'uuid';
import 'dotenv/config';

// Razorpay API credentials
const RAZORPAY_KEY_ID = process.env.RAZORPAY_KEY_ID;
const RAZORPAY_KEY_SECRET = process.env.RAZORPAY_KEY_SECRET;
const RAZORPAY_ACCOUNT_NUMBER = process.env.RAZORPAY_ACCOUNT_NUMBER;
const RAZORPAY_API_URL = process.env.NODE_ENV === 'production'
  ? 'https://api.razorpay.com/v1'
  : 'https://api.razorpay.com/v1';

// Process UPI payout using Razorpay's API
export async function processUpiPayout(payoutData: any) {
  try {
    // Generate a unique idempotency key to prevent duplicate payments
    const idempotencyKey = uuidv4();

    // Prepare the payout request payload
    const payload = {
      account_number: RAZORPAY_ACCOUNT_NUMBER,
      amount: payoutData.amountInPaise, // Amount in paise
      currency: "INR",
      mode: "UPI",
      purpose: "payout",
      fund_account: {
        account_type: "vpa",
        vpa: {
          address: payoutData.upiId
        },
        contact: {
          name: payoutData.name,
          email: payoutData.email || "",
          contact: payoutData.phone || "",
          type: "customer",
          reference_id: `doctor_${payoutData.doctorId}`,
          notes: {
            doctor_id: payoutData.doctorId.toString()
          }
        }
      },
      queue_if_low_balance: true,
      reference_id: payoutData.transactionId,
      narration: "Medical Survey Rewards Payout",
      notes: {
        redemption_id: payoutData.redemptionId.toString(),
        points_redeemed: payoutData.pointsRedeemed.toString(),
        reward_type: "UPI Payout"
      }
    };

    // Make the API call to Razorpay
    const response = await axios({
      method: 'post',
      url: `${RAZORPAY_API_URL}/payouts`,
      auth: {
        username: RAZORPAY_KEY_ID as string,
        password: RAZORPAY_KEY_SECRET as string
      },
      headers: {
        'Content-Type': 'application/json',
        'X-Payout-Idempotency': idempotencyKey
      },
      data: payload
    });

    return {
      success: true,
      payoutId: response.data.id,
      status: response.data.status,
      utr: response.data.utr,
      data: response.data
    };
  } catch (error: any) {
    console.error('Razorpay payout error:', error.response?.data || error.message);

    // Handle different error scenarios
    let errorMessage = 'Unknown error occurred';
    let errorCode = 'unknown_error';

    if (error.response) {
      errorMessage = error.response.data.error?.description || 'Payment gateway error';
      errorCode = error.response.data.error?.code || 'gateway_error';
    } else if (error.request) {
      errorMessage = 'Unable to connect to payment gateway';
      errorCode = 'connection_error';
    } else {
      errorMessage = error.message;
      errorCode = 'client_error';
    }

    throw {
      success: false,
      errorCode,
      message: errorMessage,
      originalError: error.response?.data || error.message
    };
  }
}

// Process Amazon gift card balance payment using Razorpay
// Process Amazon Pay balance
// Process Amazon Pay balance payment using Razorpay
export async function processAmazonPayBalance(payoutData: any) {
  try {
    // Generate a unique idempotency key to prevent duplicate payments
    const idempotencyKey = uuidv4();

    // Prepare the payout request payload
    const payload = {
      account_number: RAZORPAY_ACCOUNT_NUMBER,
      amount: payoutData.amountInPaise, // Amount in paise
      currency: "INR",
      mode: "amazonpay",  // Use amazonpay mode for Amazon Pay balance
      purpose: "payout",
      fund_account: {
        account_type: "wallet",
        wallet: {
          provider: "amazonpay",
          phone: payoutData.phoneNumber,  // Use phone number for Amazon Pay
          name: payoutData.name
        },
        contact: {
          name: payoutData.name,
          contact: payoutData.phoneNumber,
          type: "customer",
          reference_id: `doctor_${payoutData.doctorId}`,
          notes: {
            doctor_id: payoutData.doctorId.toString()
          }
        }
      },
      queue_if_low_balance: true,
      reference_id: payoutData.transactionId,
      narration: "Medical Survey Rewards",
      notes: {
        redemption_id: payoutData.redemptionId.toString(),
        points_redeemed: payoutData.pointsRedeemed.toString(),
        reward_type: "Amazon Pay Balance"
      }
    };

    // Make the API call to Razorpay
    const response = await axios({
      method: 'post',
      url: `${RAZORPAY_API_URL}/payouts`,
      auth: {
        username: RAZORPAY_KEY_ID as string,
        password: RAZORPAY_KEY_SECRET as string
      },
      headers: {
        'Content-Type': 'application/json',
        'X-Payout-Idempotency': idempotencyKey
      },
      data: payload
    });

    return {
      success: true,
      payoutId: response.data.id,
      status: response.data.status,
      utr: response.data.utr,
      data: response.data
    };
  } catch (error: any) {
    console.error('Razorpay Amazon Pay balance error:', error.response?.data || error.message);

    // Handle different error scenarios
    let errorMessage = 'Unknown error occurred';
    let errorCode = 'unknown_error';

    if (error.response) {
      errorMessage = error.response.data.error?.description || 'Payment gateway error';
      errorCode = error.response.data.error?.code || 'gateway_error';
    } else if (error.request) {
      errorMessage = 'Unable to connect to payment gateway';
      errorCode = 'connection_error';
    } else {
      errorMessage = error.message;
      errorCode = 'client_error';
    }

    throw {
      success: false,
      errorCode,
      message: errorMessage,
      originalError: error.response?.data || error.message
    };
  }
}

// Check the status of a payout
export async function checkPayoutStatus(payoutId: string) {
  try {
    const response = await axios({
      method: 'get',
      url: `${RAZORPAY_API_URL}/payouts/${payoutId}`,
      auth: {
        username: RAZORPAY_KEY_ID as string,
        password: RAZORPAY_KEY_SECRET as string
      }
    });

    return {
      success: true,
      payoutId: response.data.id,
      status: response.data.status,
      utr: response.data.utr,
      data: response.data
    };
  } catch (error: any) {
    console.error('Error checking payout status:', error.response?.data || error.message);
    throw {
      success: false,
      message: error.response?.data?.error?.description || 'Failed to check payout status',
      originalError: error.response?.data || error.message
    };
  }
}

// Test Razorpay credentials
export async function testRazorpayCredentials() {
  try {
    const response = await axios({
      method: 'get',
      url: `${RAZORPAY_API_URL}/balance`,
      auth: {
        username: RAZORPAY_KEY_ID as string,
        password: RAZORPAY_KEY_SECRET as string
      }
    });
    console.log('Razorpay authentication successful');
    return response.data;
  } catch (error: any) {
    console.error('Razorpay authentication test failed:', error.response?.data || error.message);
    return null;
  }
}