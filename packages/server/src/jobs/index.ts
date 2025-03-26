import cron from "node-cron";

export function startCronJobs() {
  try {
    cron.schedule("0 13 * * *", () => {});
    console.log("Started all cron jobs successfully");
  } catch (error) {
    console.log("Failed to start cron jobs");
    console.log(error);
  }
}

startCronJobs();
