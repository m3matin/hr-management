import "dotenv/config";
import { createApp } from "./app.js";
import { connectDatabase, disconnectDatabase } from "./database/bootstrap.js";

const port = Number(process.env.PORT || 4000);

async function startServer(): Promise<void> {
  await connectDatabase();

  const server = createApp().listen(port, () => {
    console.log(`Salary API listening on http://localhost:${port}`);
  });

  const shutdown = (signal: string) => {
    console.log(`${signal} received; shutting down`);
    server.close(() => {
      void disconnectDatabase().finally(() => process.exit(0));
    });
  };

  process.once("SIGINT", () => shutdown("SIGINT"));
  process.once("SIGTERM", () => shutdown("SIGTERM"));
}

void startServer().catch((error: unknown) => {
  console.error("Failed to start the Salary API", error);
  process.exitCode = 1;
});
