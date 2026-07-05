import dotenv from "dotenv";

dotenv.config();

export const env = {
  port: Number(process.env.PORT || 4000),
  mongodbUri: process.env.MONGODB_URI || "mongodb://localhost:27017/adventure-sv",
  googleMapsApiKey: process.env.GOOGLE_MAPS_API_KEY || "",
  weatherApiKey: process.env.WEATHER_API_KEY || "",
  aiProvider: process.env.AI_PROVIDER || "gemini",
  aiApiKey: process.env.AI_API_KEY || "",
  aiModel: process.env.AI_MODEL || "gemini-2.5-flash",
  telegramBotToken: process.env.TELEGRAM_BOT_TOKEN || "",
  frontendUrl: process.env.FRONTEND_URL || "http://localhost:5173",
  skipDbConnection: process.env.SKIP_DB_CONNECTION === "true",
  nodeEnv: process.env.NODE_ENV || "development",
};
