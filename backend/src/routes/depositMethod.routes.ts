import { Router } from "express";
import * as depositMethodController from "../controllers/depositMethod.controller";
import { protect, authorize } from "../middlewares/auth.middleware";
import { validate } from "../utils/validators/validate";
import { depositMethodSchema } from "../utils/validators/plan.validator";

const router = Router();

router.use(protect);

// Executor — full management (must be before /:id to avoid route conflict)
router.get("/all", authorize("Executor"), depositMethodController.getAll);

// Trader — view active methods and single method details before depositing
router.get("/", authorize("Trader"), depositMethodController.getActive);
router.get("/:id", authorize("Trader", "Executor"), depositMethodController.getOne);
router.post("/", authorize("Executor"), validate(depositMethodSchema), depositMethodController.create);
router.patch("/:id", authorize("Executor"), depositMethodController.update);
router.patch("/:id/toggle", authorize("Executor"), depositMethodController.toggle);
router.delete("/:id", authorize("Executor"), depositMethodController.remove);

export default router;
