import cron from "node-cron";
import { LoanApplication } from "../models/loan.model";
import { User } from "../models/user.model";
import { sendEmail } from "../services/email.service";
import { loanDueReminderEmail } from "../emails";

const DASHBOARD_URL = `${process.env.CLIENT_URL}/dashboard/loans`;

export const startLoanDueReminderJob = () => {
  // every day at 8:00 AM
  cron.schedule("0 8 * * *", async () => {
    try {
      const now = new Date();

      const thresholds = [
        { days: 3, label: "3 days" },
        { days: 1, label: "1 day" },
      ];

      for (const { days } of thresholds) {
        const from = new Date(now.getTime() + days * 24 * 60 * 60 * 1000 - 60 * 60 * 1000);
        const to = new Date(now.getTime() + days * 24 * 60 * 60 * 1000 + 60 * 60 * 1000);

        const loans = await LoanApplication.find({
          status: "active",
          dueDate: { $gte: from, $lte: to },
        }).lean();

        for (const loan of loans) {
          const user = await User.findById(loan.user).select("email username").lean();
          if (!user) continue;

          const remaining = loan.amountDue - loan.repaidAmount;
          await sendEmail(
            user.email,
            "Loan Repayment Reminder",
            loanDueReminderEmail(
              user.username,
              `$${remaining.toFixed(2)}`,
              loan.dueDate!.toDateString(),
              days,
              DASHBOARD_URL
            )
          );
        }

        if (loans.length > 0) {
          console.log(`[LoanJob] Sent ${loans.length} reminder(s) for loans due in ${days} day(s)`);
        }
      }
    } catch (err) {
      console.error("[LoanJob] Error:", err);
    }
  });

  console.log("[LoanJob] Scheduler started");
};
