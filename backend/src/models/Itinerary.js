import mongoose from "mongoose";

const itinerarySchema = new mongoose.Schema(
  {
    channel: {
      type: String,
      enum: ["web", "whatsapp", "telegram"],
      required: true,
    },
    phone: String,
    request: Object,
    summary: String,
    context: Object,
    budgetUsd: Number,
    estimatedCostUsd: Number,
    adjustments: [String],
    rejectedPlaceIds: [String],
    days: [Object],
  },
  { timestamps: true }
);

export const Itinerary = mongoose.model("Itinerary", itinerarySchema);
