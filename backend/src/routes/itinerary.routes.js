import { Router } from "express";
import { createItinerary, rerollActivity } from "../controllers/itinerary.controller.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const router = Router();

router.post("/", asyncHandler(createItinerary));
router.post("/:itineraryId/activities/:activityId/reroll", asyncHandler(rerollActivity));

export default router;
