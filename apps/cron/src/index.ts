import cron from "node-cron";
import { CleanupPostService, schedulePostService } from "./services/post-service";

// A Cron for Scheduling Posts Creation.
let postSchedukeCronRunning = false;
let postCleanupCronRunning = false;

cron.schedule(
    "0 */2 * * *",
    async () => {
        if (postSchedukeCronRunning) {
            console.log("Skipping cron run: job still running");
            return;
        }

        try {
            postSchedukeCronRunning = true;
            console.log("Running post scheduler...");
            await schedulePostService();
        } catch (err) {
            console.error("Post scheduler failed:", err);
        } finally {
            postSchedukeCronRunning = false;
        }
    },
    {
        timezone: "UTC"
    }
);

// A Cron for Scheduling Posts Cleanup.
cron.schedule(
    "0 2 * * *",
    async () => {
        if (postCleanupCronRunning) {
            console.log("Skipping cron run: job still running");
            return;
        }

        try {
            postCleanupCronRunning = true;
            console.log("Running post Cleanup...");
            await CleanupPostService();
        } catch (err) {
            console.error("Post Cleanup failed:", err);
        } finally {
            postCleanupCronRunning = false;
        }
    },
    {
        timezone: "UTC"
    }
);

console.log("Cron Server Running");
