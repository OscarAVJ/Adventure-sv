import mongoose from "mongoose";

const occasionRuleSchema = new mongoose.Schema(
  {
    key: {
      type: String,
      required: true,
      unique: true,
    },
    label: {
      type: String,
      required: true,
    },
    tags: [String],
    preferredCategories: [String],
    avoidedCategories: [String],
    tone: {
      type: String,
      enum: ["relaxed", "romantic", "family", "adventure", "premium", "budget"],
    },
    zoneBoosts: [
      {
        zone: String,
        weight: Number,
      },
    ],
    placeBoosts: [
      {
        googlePlaceId: String,
        weight: Number,
      },
    ],
    active: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

export const OccasionRule = mongoose.model("OccasionRule", occasionRuleSchema);
