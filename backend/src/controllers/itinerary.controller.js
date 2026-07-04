import { generateItinerary } from "../services/itinerary.service.js";
import { validateItineraryRequest } from "../validators/itinerary.validator.js";

export async function createItinerary(req, res) {
  validateItineraryRequest(req.body);
  const response = await generateItinerary(req.body);
  res.status(201).json(response);
}
