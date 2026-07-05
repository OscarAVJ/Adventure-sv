import { generateItinerary, rerollItineraryActivity } from "../services/itinerary.service.js";
import { handleN8nChatMessage, handleN8nTelegramMessage, handleN8nWhatsappMessage } from "../services/n8nWhatsapp.service.js";
import { validateItineraryRequest } from "../validators/itinerary.validator.js";

export async function createItinerary(req, res) {
  validateItineraryRequest(req.body);
  const response = await generateItinerary(req.body);
  res.status(201).json(response);
}

export async function rerollActivity(req, res) {
  const response = await rerollItineraryActivity({
    itineraryId: req.params.itineraryId,
    activityId: req.params.activityId,
    reason: req.body?.reason,
  });
  res.status(200).json(response);
}

export async function createItineraryFromN8nWhatsapp(req, res) {
  const response = await handleN8nWhatsappMessage(req.body);
  res.status(response.status === "needs_input" ? 200 : 201).json(response);
}

export async function createItineraryFromN8nTelegram(req, res) {
  const response = await handleN8nTelegramMessage(req.body);
  res.status(response.status === "needs_input" ? 200 : 201).json(response);
}

export async function createItineraryFromN8nChat(req, res) {
  const response = await handleN8nChatMessage(req.body);
  res.status(response.status === "needs_input" ? 200 : 201).json(response);
}
