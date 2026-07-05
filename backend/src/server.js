import { createApp } from "./app.js";
import { connectDb } from "./config/db.js";
import { env } from "./config/env.js";
import { startTripModeScheduler } from "./services/tripMode.service.js";

async function bootstrap() {
  await connectDb();

  const app = createApp();
  app.listen(env.port, () => {
    console.info(`Adventure-sv backend listening on port ${env.port}`);
  });
  startTripModeScheduler();
}

bootstrap().catch((error) => {
  console.error("Failed to start Adventure-sv backend", error);
  process.exit(1);
});
