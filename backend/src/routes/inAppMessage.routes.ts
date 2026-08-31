import { Router } from "express";
import * as messageController from "../controllers/inAppMessage.controller";
import { protect, authorize } from "../middlewares/auth.middleware";
import { validate } from "../utils/validators/validate";
import { sendMessageSchema } from "../utils/validators/user.validator";

const router = Router();

router.use(protect);

// ─── Trader / Self ────────────────────────────────────────────────────────────
router.get("/", messageController.getInbox);
router.get("/unread-count", messageController.getUnreadCount);
router.patch("/read-all", messageController.markAllRead);
router.patch("/:id/read", messageController.markRead);
router.delete("/:id", messageController.deleteMessage);

// ─── Executor ─────────────────────────────────────────────────────────────────
router.post("/send", authorize("Executor"), validate(sendMessageSchema), messageController.sendMessage);

export default router;
