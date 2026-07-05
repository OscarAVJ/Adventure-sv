import mongoose from "mongoose";

// Privacy note: this profile contains reusable traveler preferences and must be deletable on user request.
const travelerProfileSchema = new mongoose.Schema(
  {
    phone: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    channel: {
      type: String,
      enum: ["whatsapp", "telegram", "web"],
      required: true,
    },
    preferredInterests: [String],
    typicalBudgetUsd: Number,
    typicalTravelers: Number,
    typicalDays: Number,
    preferredZones: [String],
    lastInteractionAt: Date,
    timesUsed: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

export const TravelerProfile = mongoose.model("TravelerProfile", travelerProfileSchema);
