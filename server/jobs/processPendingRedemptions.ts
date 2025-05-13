import { processPendingRedemptions } from '../services/redemptionService';
import { log } from '../vite';

// This script is designed to be run as a cron job
export default async function main() {
  log('Starting redemption processing job', 'cron');
  
  try {
    const result = await processPendingRedemptions();
    log(`Redemption processing completed: ${result.message}`, 'cron');
  } catch (error) {
    log(`Error processing redemptions: ${error}`, 'cron');
    console.error(error);
  }
  
  log('Redemption processing job finished', 'cron');
}

// Run the job
main().catch(console.error);