import cron from "node-cron";
import { Transaction } from "../models/transaction.model";
import { matureInvestment, expireUninvestedFunds, distributeDailyProfits, processMaturedPayout } from "../services/investment.service";

export const startInvestmentMaturityJob = () => {
  // every 5 minutes — check for matured investments
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
        console.log(`[InvestmentJob] Matured ${matured.length} investment(s)`);
      }
    } catch (err) {
      console.error("[InvestmentJob] Error:", err);
    }
  });

  // every hour — expire uninvested funds older than 48hrs
  cron.schedule("0 * * * *", async () => {
    try {
      await expireUninvestedFunds();
      console.log("[InvestmentJob] Uninvested fund expiry check complete");
    } catch (err) {
      console.error("[InvestmentJob] Expiry error:", err);
    }
  });

  // every minute — check and distribute daily profits & process matured payouts
  cron.schedule("* * * * *", async () => {
    try {
      await distributeDailyProfits();

      // Check for matured payouts that passed the 48-hour window without reinvestment
      const payoutCandidates = await Transaction.find({
        type: { $in: ["investment", "reinvestment"] },
        status: "matured",
        "meta.payoutReleaseAt": { $lte: new Date() },
      }).select("_id");

      for (const tx of payoutCandidates) {
        await processMaturedPayout(String(tx._id));
      }

      if (payoutCandidates.length > 0) {
        console.log(`[InvestmentJob] Paid out ${payoutCandidates.length} matured investment(s)`);
      }

      console.log("[InvestmentJob] Daily profit check & matured payouts check complete");
    } catch (err) {
      console.error("[InvestmentJob] Profit distribution / payout error:", err);
    }
  });

  console.log("[InvestmentJob] Scheduler started");
};
