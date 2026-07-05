import { Router } from "express";
import { createItinerary, getItineraryGenerationStatus, rerollActivity } from "../controllers/itinerary.controller.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const router = Router();

router.post("/", asyncHandler(createItinerary));
router.get("/:itineraryId/status", asyncHandler(getItineraryGenerationStatus));
router.post("/:itineraryId/activities/:activityId/reroll", asyncHandler(rerollActivity));

export default router;
