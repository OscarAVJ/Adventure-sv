import dotenv from "dotenv";

dotenv.config();

export const env = {
  port: Number(process.env.PORT || 4000),
  mongodbUri: process.env.MONGODB_URI || "mongodb://localhost:27017/adventure-sv",
  googleMapsApiKey: process.env.GOOGLE_MAPS_API_KEY || "",
  weatherApiKey: process.env.WEATHER_API_KEY || "",
  aiApiKey: process.env.AI_API_KEY || "",
  frontendUrl: process.env.FRONTEND_URL || "http://localhost:5173",
  skipDbConnection: process.env.SKIP_DB_CONNECTION === "true",
  nodeEnv: process.env.NODE_ENV || "development",
};
