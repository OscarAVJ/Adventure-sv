import mongoose from "mongoose";

const promotedPlaceSchema = new mongoose.Schema(
  {
    googlePlaceId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    zone: {
      type: String,
      index: true,
    },
    categories: [
      {
        type: String,
        enum: ["playa", "surf", "cultura", "naturaleza", "hospedaje", "comida", "tour", "romantico", "familia"],
      },
    ],
    priority: {
      type: Number,
      default: 0,
      min: 0,
      max: 3,
    },
    visibilityWeight: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    featured: {
      type: Boolean,
      default: false,
    },
    campaignStatus: {
      type: String,
      enum: ["active", "paused", "expired"],
      default: "active",
      index: true,
    },
  },
  { timestamps: true }
);

export const PromotedPlace = mongoose.model("PromotedPlace", promotedPlaceSchema);
