import { startInvestmentMaturityJob } from "./investmentMaturity.job";
import { startPositionExpiryJob } from "./positionExpiry.job";
import { startLoanDueReminderJob } from "./loanDueReminder.job";

export const startAllJobs = () => {
  startInvestmentMaturityJob();
  startPositionExpiryJob();
  startLoanDueReminderJob();
  console.log("[Jobs] All schedulers running");
};
