import { generateItinerary } from "../services/itinerary.service.js";
import { handleN8nWhatsappMessage } from "../services/n8nWhatsapp.service.js";
import { validateItineraryRequest } from "../validators/itinerary.validator.js";

export async function createItinerary(req, res) {
  validateItineraryRequest(req.body);
  const response = await generateItinerary(req.body);
  res.status(201).json(response);
}

export async function createItineraryFromN8nWhatsapp(req, res) {
  const response = await handleN8nWhatsappMessage(req.body);
  res.status(response.status === "needs_input" ? 200 : 201).json(response);
}
