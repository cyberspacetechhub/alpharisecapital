import { Router } from "express";
import * as authController from "../controllers/auth.controller";
import { protect } from "../middlewares/auth.middleware";
import { validate } from "../utils/validators/validate";
import { registerSchema, loginSchema } from "../utils/validators/auth.validator";

const router = Router();

router.post("/register/trader", validate(registerSchema), authController.register("Trader"));
router.post("/register/executor", validate(registerSchema), authController.register("Executor"));
router.post("/login", validate(loginSchema), authController.login);
router.post("/refresh", authController.refresh);
router.post("/logout", protect, authController.logout);
router.get("/verify-email", authController.verifyEmail);
router.post("/forgot-password", authController.forgotPassword);
router.post("/reset-password", authController.resetPassword);

export default router;
