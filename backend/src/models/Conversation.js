import mongoose from "mongoose";

const conversationSchema = new mongoose.Schema(
  {
    channel: {
      type: String,
      enum: ["whatsapp", "web"],
      required: true,
    },
    phone: {
      type: String,
      index: true,
    },
    status: {
      type: String,
      enum: ["active", "closed"],
      default: "active",
    },
    messages: [
      {
        role: {
          type: String,
          enum: ["user", "assistant", "system"],
        },
        content: String,
        createdAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    lastItineraryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Itinerary",
    },
  },
  { timestamps: true }
);

export const Conversation = mongoose.model("Conversation", conversationSchema);
