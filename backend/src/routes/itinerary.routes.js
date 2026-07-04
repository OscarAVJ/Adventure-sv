import { Router } from "express";
import { createItinerary } from "../controllers/itinerary.controller.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const router = Router();

router.post("/", asyncHandler(createItinerary));

export default router;
