import cron from "node-cron";
import { Position } from "../models/position.model";
import { closePosition } from "../services/position.service";

export const startPositionExpiryJob = () => {
  // every minute — check for expired open positions
  cron.schedule("* * * * *", async () => {
    try {
      const expired = await Position.find({
        status: "open",
        expiresAt: { $lte: new Date() },
      }).select("_id currentPrice");

      for (const pos of expired) {
        await closePosition(String(pos._id), "system", pos.currentPrice);
      }

      if (expired.length > 0) {
        console.log(`[PositionJob] Closed ${expired.length} expired position(s)`);
      }
    } catch (err) {
      console.error("[PositionJob] Error:", err);
    }
  });

  console.log("[PositionJob] Scheduler started");
};
