import mongoose from "mongoose";
import { env } from "./env.js";

export async function connectDb() {
  if (env.skipDbConnection) {
    console.info("MongoDB connection skipped by SKIP_DB_CONNECTION=true");
    return null;
  }

  mongoose.set("strictQuery", true);
  const connection = await mongoose.connect(env.mongodbUri);
  console.info(`MongoDB connected: ${connection.connection.host}`);
  return connection;
}
