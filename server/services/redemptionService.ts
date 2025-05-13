import { storage } from '../storage';
import * as razorpayService from './razonpayService';
import { v4 as uuidv4 } from 'uuid';

// Process pending redemption requests
// Process pending redemption requests
export async function processPendingRedemptions() {
  try {
    // Find all pending redemptions
    const pendingRedemptions = await storage.getRedemptionsByStatus('pending');
    
    if (pendingRedemptions.length === 0) {
      return { processed: 0, failed: 0, message: 'No pending redemptions found' };
    }
    
    let processed = 0;
    let failed = 0;
    
    for (const redemption of pendingRedemptions) {
      try {
        if (redemption.redemptionType === 'upi') {
          // Process UPI payment using Razorpay
          await processUpiPayment(redemption);
        } else if (redemption.redemptionType === 'amazon') {
          // Process Amazon Pay balance using Razorpay and mobile number
          await processAmazonPayBalance(redemption);
        }
        
        // Mark as processed
        await storage.updateRedemption(redemption.id, {
          status: 'processed',
          processedAt: new Date()
        });
        
        processed++;
      } catch (error: any) {
        console.error(`Failed to process redemption ${redemption.id}:`, error);
        
        // Mark as failed
        await storage.updateRedemption(redemption.id, {
          status: 'failed',
          failureReason: error.message || 'Unknown error occurred'
        });
        
        // Restore points to doctor
        const doctor = await storage.getDoctor(redemption.doctorId);
        if (doctor) {
          await storage.updateDoctor(doctor.id, {
            redeemedPoints: doctor.redeemedPoints - redemption.points
          });
        }
        
        failed++;
      }
    }
    
    return {
      processed,
      failed,
      total: pendingRedemptions.length,
      message: `Processed ${processed} redemptions, ${failed} failed`
    };
  } catch (error) {
    console.error('Error processing redemptions:', error);
    throw error;
  }
}

// Process UPI payment using Razorpay
// Process UPI payment using Razorpay
async function processUpiPayment(redemption: any) {
  if (!redemption.redemptionDetails) {
    throw new Error('UPI ID is required for UPI payment');
  }
  
  try {
    let upiId;
    
    // Check if redemptionDetails is already a string or if it needs to be parsed
    if (typeof redemption.redemptionDetails === 'string') {
      try {
        // First try to parse it as JSON
        const parsedDetails = JSON.parse(redemption.redemptionDetails);
        upiId = parsedDetails;
      } catch (e) {
        // If parsing fails, use the string directly as the UPI ID
        upiId = redemption.redemptionDetails;
      }
    } else {
      // If it's an object, get the upiId property
      upiId = redemption.redemptionDetails.upiId;
    }
    
    if (!upiId) {
      throw new Error('UPI ID not found in redemption details');
    }
    
    // Get doctor and user details
    const doctor = await storage.getDoctor(redemption.doctorId);
    if (!doctor) {
      throw new Error('Doctor not found');
    }
    
    const user = await storage.getUser(doctor.userId);
    if (!user) {
      throw new Error('User not found');
    }
    
    // Prepare payout data
    const payoutData = {
      doctorId: doctor.id,
      redemptionId: redemption.id,
      transactionId: `redemption_${redemption.id}`,
      amountInPaise: calculateRedemptionValue(redemption.points) * 100, // Convert rupees to paise
      pointsRedeemed: redemption.points,
      upiId: upiId,
      name: user.name,
      email: user.email || 'noemail@example.com',
      phone: user.phone
    };
    
    // Process payout through Razorpay
    const result = await razorpayService.processUpiPayout(payoutData);
    
    // Update redemption with payout details
    await storage.updateRedemption(redemption.id, {
      payoutId: result.payoutId,
      payoutStatus: result.status,
      payoutResponse: JSON.stringify(result.data)
    });
    
    return result;
  } catch (error: any) {
    console.error('Error processing UPI payment:', error);
    throw new Error(error.message || 'Failed to process UPI payment');
  }
}

// Process Amazon Pay balance
// Process Amazon Pay balance
async function processAmazonPayBalance(redemption: any) {
  if (!redemption.redemptionDetails) {
    throw new Error('Redemption details missing for Amazon Pay balance');
  }
  
  try {
    let phoneNumber;
    
    // Check if redemptionDetails is already a string or if it needs to be parsed
    if (typeof redemption.redemptionDetails === 'string') {
      try {
        // First try to parse it as JSON
        const parsedDetails = JSON.parse(redemption.redemptionDetails);
        phoneNumber = parsedDetails;
      } catch (e) {
        // If parsing fails, use the string directly as the phone number
        phoneNumber = redemption.redemptionDetails;
      }
    } else {
      // If it's an object, get the phoneNumber property
      phoneNumber = redemption.redemptionDetails.phoneNumber;
    }
    
    if (!phoneNumber) {
      throw new Error('Phone number not found in redemption details');
    }
    
    // Get doctor and user details
    const doctor = await storage.getDoctor(redemption.doctorId);
    if (!doctor) {
      throw new Error('Doctor not found');
    }
    
    const user = await storage.getUser(doctor.userId);
    if (!user) {
      throw new Error('User not found');
    }
    
    // Prepare payout data
    const payoutData = {
      doctorId: doctor.id,
      redemptionId: redemption.id,
      transactionId: `redemption_${redemption.id}`,
      amountInPaise: calculateRedemptionValue(redemption.points) * 100, // Convert rupees to paise
      pointsRedeemed: redemption.points,
      phoneNumber: phoneNumber,
      name: user.name
    };
    
    // Process payout through Razorpay
    const result = await razorpayService.processAmazonPayBalance(payoutData);
    
    // Update redemption with payout details
    await storage.updateRedemption(redemption.id, {
      payoutId: result.payoutId,
      payoutStatus: result.status,
      payoutResponse: JSON.stringify(result.data)
    });
    
    return result;
  } catch (error: any) {
    console.error('Error processing Amazon Pay balance:', error);
    throw new Error(error.message || 'Failed to process Amazon Pay balance');
  }
}

// Helper function to calculate redemption value based on points
function calculateRedemptionValue(points: number): number {
  // Example: 100 points = ₹100
  return points;
}