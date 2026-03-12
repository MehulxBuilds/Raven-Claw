import cron from "node-cron";
import { schedulePostService } from "./services/post-service";

// A Cron for Scheduling Posts Creation.
let postCronRunning = false;

cron.schedule(
    "0 */2 * * *",
    async () => {
        if (postCronRunning) {
            console.log("Skipping cron run: job still running");
            return;
        }

        try {
            postCronRunning = true;
            console.log("Running post scheduler...");
            await schedulePostService();
        } catch (err) {
            console.error("Post scheduler failed:", err);
        } finally {
            postCronRunning = false;
        }
    },
    {
        timezone: "UTC"
    }
);

// A Cron for Scheduling Posts Cleanup.


console.log("Cron Server Running");