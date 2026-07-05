import { deleteTravelerProfile } from "../services/travelerProfile.service.js";

export async function deleteTraveler(req, res) {
  const result = await deleteTravelerProfile(req.params.phone);
  res.json({
    success: true,
    ...result,
  });
}
