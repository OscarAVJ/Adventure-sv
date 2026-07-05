import { Router } from "express";
import {
  createItinerary,
  createItineraryFromN8nChat,
  createItineraryFromN8nTelegram,
  createItineraryFromN8nWhatsapp,
  receiveTelegramCallback,
} from "../controllers/itinerary.controller.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const router = Router();

router.post("/whatsapp/itineraries", asyncHandler(createItinerary));
router.post("/n8n/whatsapp", asyncHandler(createItineraryFromN8nWhatsapp));
router.post("/n8n/telegram", asyncHandler(createItineraryFromN8nTelegram));
router.post("/n8n/chat", asyncHandler(createItineraryFromN8nChat));
router.post("/telegram/callback", asyncHandler(receiveTelegramCallback));

export default router;
