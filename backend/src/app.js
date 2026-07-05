import cors from "cors";
import express from "express";
import { env } from "./config/env.js";
import { errorMiddleware } from "./middleware/error.middleware.js";
import { notFoundMiddleware } from "./middleware/notFound.middleware.js";
import itineraryRoutes from "./routes/itinerary.routes.js";
import travelerRoutes from "./routes/traveler.routes.js";
import webhookRoutes from "./routes/webhook.routes.js";

export function createApp() {
  const app = express();

  app.use(cors({ origin: env.frontendUrl, credentials: true }));
  app.use(express.json({ limit: "1mb" }));

  app.get("/api/health", (_req, res) => {
    res.json({ success: true, status: "ok", service: "adventure-sv-backend" });
  });

  app.use("/api/itineraries", itineraryRoutes);
  app.use("/api/travelers", travelerRoutes);
  app.use("/api/webhooks", webhookRoutes);

  app.use(notFoundMiddleware);
  app.use(errorMiddleware);

  return app;
}
