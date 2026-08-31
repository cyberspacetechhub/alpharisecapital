import { Router } from "express";
import * as walletController from "../controllers/walletLink.controller";
import { protect, authorize } from "../middlewares/auth.middleware";
import { validate } from "../utils/validators/validate";
import { walletLinkSchema } from "../utils/validators/user.validator";

const router = Router();

router.use(protect);

// ─── Trader ───────────────────────────────────────────────────────────────────
router.get("/", authorize("Trader"), walletController.getMyWallets);
router.post("/", authorize("Trader"), validate(walletLinkSchema), walletController.addWallet);
router.patch("/:id/primary", authorize("Trader"), walletController.setPrimary);
router.delete("/:id", authorize("Trader"), walletController.removeWallet);

// ─── Executor ─────────────────────────────────────────────────────────────────
router.get("/all", authorize("Executor"), walletController.getAllWallets);
router.get("/user/:userId", authorize("Executor"), walletController.getUserWallets);
router.patch("/:id/verify", authorize("Executor"), walletController.verifyWallet);

export default router;
