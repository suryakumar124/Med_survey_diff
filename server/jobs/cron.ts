import cron from 'node-cron';
import { processPendingRedemptions } from '../services/redemptionService';

// Run every minute (* * * * *)
export function startCronJobs() {
  console.log('Setting up cron jobs', 'cron');

  cron.schedule('0 * * * *', async () => {
    console.log('Running scheduled redemption processing', 'cron');
    try {
      const result = await processPendingRedemptions();
      console.log(`Redemption processing completed: ${result.message}`, 'cron');
    } catch (error) {
      console.error(`Error processing redemptions: ${error}`, 'cron');
      console.error(error); 
    }
  });

  console.log('Cron jobs initialized successfully', 'cron');
}