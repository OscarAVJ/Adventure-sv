import { Router } from "express";
import { deleteTraveler } from "../controllers/traveler.controller.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const router = Router();

router.delete("/:phone", asyncHandler(deleteTraveler));

export default router;
