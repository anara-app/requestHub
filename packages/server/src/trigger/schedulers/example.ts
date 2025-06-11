import { schedules } from "@trigger.dev/sdk/v3";

export const firstScheduledTask = schedules.task({
  id: "first-scheduled-task",
  //every two hours (UTC timezone)
  cron: "0 */2 * * *",
  run: async (payload, { ctx }) => {
    //do something
  },
});
