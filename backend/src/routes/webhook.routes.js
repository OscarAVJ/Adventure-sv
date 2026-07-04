import { Router } from "express";
import { createItinerary, createItineraryFromN8nWhatsapp } from "../controllers/itinerary.controller.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const router = Router();

router.post("/whatsapp/itineraries", asyncHandler(createItinerary));
router.post("/n8n/whatsapp", asyncHandler(createItineraryFromN8nWhatsapp));

export default router;
