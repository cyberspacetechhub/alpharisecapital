import cron from "node-cron";
import { Transaction } from "../models/transaction.model";
import {
  matureInvestment,
  distributeDailyProfits,
  cleanExpiredEscrows,
} from "../services/investment.service";
import { cleanupResolvedServices } from "../services/accountService.service";

export const startInvestmentMaturityJob = () => {
  // Check for matured / completed investments every 5 minutes
  cron.schedule("*/5 * * * *", async () => {
    try {
      const matured = await Transaction.find({
        type: { $in: ["investment", "reinvestment"] },
        status: "approved",
        expiresAt: { $lte: new Date() },
      }).select("_id");

      for (const tx of matured) {
        await matureInvestment(String(tx._id));
      }

      if (matured.length > 0) {
        console.log(`[InvestmentJob] Completed ${matured.length} matured investment(s) and credited balance`);
      }
    } catch (err) {
      console.error("[InvestmentJob] Error:", err);
    }
  });

  // Check and distribute 24-hour daily profits & cleanup escrows & 24hr resolved services every 10 minutes
  cron.schedule("*/10 * * * *", async () => {
    try {
      await distributeDailyProfits();
      await cleanExpiredEscrows();
      await cleanupResolvedServices();
      console.log("[InvestmentJob] Daily profit, escrow & account services cleanup cycle complete");
    } catch (err) {
      console.error("[InvestmentJob] Profit distribution / escrow / account service error:", err);
    }
  });

  console.log("[InvestmentJob] Investment scheduler started");
};
