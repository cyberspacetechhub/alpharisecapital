import { Router } from "express";
import * as userController from "../controllers/user.controller";
import { protect, authorize } from "../middlewares/auth.middleware";
import { validate } from "../utils/validators/validate";
import { updateProfileSchema, kycSubmitSchema } from "../utils/validators/user.validator";
import { changePasswordSchema } from "../utils/validators/auth.validator";
import { upload } from "../middlewares/upload.middleware";

const router = Router();

router.use(protect);

// ─── Trader / Self ────────────────────────────────────────────────────────────
router.get("/me", userController.getMe);
router.get("/dashboard", userController.getDashboard);
router.patch("/me", validate(updateProfileSchema), userController.updateProfile);
router.patch("/me/avatar", upload.single("avatar"), userController.updateAvatar);
router.post("/me/upload", upload.single("file"), userController.uploadFile);
router.patch("/me/password", validate(changePasswordSchema), userController.changePassword);
router.post("/me/kyc", validate(kycSubmitSchema), userController.submitKyc);

// ─── Executor: Trader Management ─────────────────────────────────────────────
router.get("/executor-stats", authorize("Executor"), userController.getExecutorStats);
router.get("/traders", authorize("Executor"), userController.getAllTraders);
router.get("/traders/:id", authorize("Executor"), userController.getTraderDetails);
router.patch("/traders/:id/kyc", authorize("Executor"), userController.updateKycStatus);
router.patch("/traders/:id/unverify", authorize("Executor"), userController.unverifyTrader);
router.patch("/traders/:id/toggle", authorize("Executor"), userController.toggleUserActive);
router.post("/traders/:id/impersonate", authorize("Executor"), userController.impersonateTrader);
router.post("/traders/:id/balance-action", authorize("Executor"), userController.manageTraderBalance);

export default router;
