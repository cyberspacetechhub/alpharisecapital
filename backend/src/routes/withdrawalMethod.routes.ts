import { Router } from "express";
import * as withdrawalMethodController from "../controllers/withdrawalMethod.controller";
import { protect, authorize } from "../middlewares/auth.middleware";
import { validate } from "../utils/validators/validate";
import { withdrawalMethodSchema } from "../utils/validators/plan.validator";

const router = Router();

router.use(protect);

// Executor — full management (must be before /:id to avoid route conflict)
router.get("/all", authorize("Executor"), withdrawalMethodController.getAll);

// Trader — view active methods before requesting withdrawal
router.get("/", authorize("Trader"), withdrawalMethodController.getActive);
router.get("/:id", authorize("Trader", "Executor"), withdrawalMethodController.getOne);
router.post("/", authorize("Executor"), validate(withdrawalMethodSchema), withdrawalMethodController.create);
router.patch("/:id", authorize("Executor"), withdrawalMethodController.update);
router.patch("/:id/toggle", authorize("Executor"), withdrawalMethodController.toggle);
router.delete("/:id", authorize("Executor"), withdrawalMethodController.remove);

export default router;
