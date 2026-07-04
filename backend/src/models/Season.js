import mongoose from "mongoose";

const seasonSchema = new mongoose.Schema(
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
    startMonth: Number,
    startDay: Number,
    endMonth: Number,
    endDay: Number,
    tags: [String],
    preferredCategories: [String],
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

export const Season = mongoose.model("Season", seasonSchema);
