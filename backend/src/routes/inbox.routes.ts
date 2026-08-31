import { Router } from "express";
import * as ctrl from "../controllers/inbox.controller";
import { protect, authorize } from "../middlewares/auth.middleware";

const router = Router();

router.use(protect, authorize("Executor"));

// Received emails
router.get("/", ctrl.listEmails);
router.get("/:id", ctrl.getEmail);
router.delete("/:id", ctrl.deleteEmail);
router.get("/:emailId/attachments", ctrl.listReceivedAttachments);
router.get("/:emailId/attachments/:id", ctrl.getReceivedAttachment);

// Sent emails
router.get("/sent/list", ctrl.listSentEmails);
router.get("/sent/:id", ctrl.getSentEmail);
router.get("/sent/:emailId/attachments", ctrl.listSentAttachments);
router.get("/sent/:emailId/attachments/:id", ctrl.getSentAttachment);

// Compose
router.post("/send", ctrl.sendEmail);

export default router;
