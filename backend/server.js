import "dotenv/config";
import cors from "cors";
import express from "express";
import authRoutes from "./routes/authRoutes.js";
import productRoutes from "./routes/productRoute.js";
import settingsRoutes from "./routes/settingsRoute.js";
import { authenticateUser } from "./middleware/authMiddleware.js";
import { getDashboard } from "./controllers/productController.js";

if (!process.env.JWT_SECRET) {
  throw new Error("JWT_SECRET must be set in backend/.env");
}

const app = express();

app.use(cors({
  origin: process.env.CLIENT_URL,
}));

app.use(express.json());
app.use("/api/auth", authRoutes);
app.use("/api/products", productRoutes);
app.use("/api/settings", settingsRoutes);
app.get("/api/dashboard", authenticateUser, getDashboard);

app.use((req, res) => {
  console.warn(`[${new Date().toISOString()}] ${req.method} ${req.path} returned 404`);
  res.status(404).json({ error: "Route not found" });
});

app.use((error, req, res, next) => {
  const status = Number.isInteger(error.status) && error.status >= 400 && error.status < 500
    ? error.status
    : 500;
  const timestamp = new Date().toISOString();
  console.error(
    `[${timestamp}] ${req.method} ${req.path} failed with status ${status}`,
    error.stack || error
  );
  const message = error.type === "entity.parse.failed"
    ? "Request body must contain valid JSON"
    : status === 500
      ? "Internal server error"
      : "Invalid request";
  res.status(status).json({ error: message });
});

const port = Number(process.env.PORT);

process.on("unhandledRejection", (reason) => {
  console.error(`[${new Date().toISOString()}] Unhandled promise rejection`, reason);
  process.exit(1);
});

process.on("uncaughtException", (error) => {
  console.error(`[${new Date().toISOString()}] Uncaught exception`, error.stack || error);
  process.exit(1);
});

const server = app.listen(port, () => {
  console.log(`StockFlow API listening on port ${port}`);
});

server.on("error", (error) => {
  console.error(`[${new Date().toISOString()}] API server failed to start`, error.stack || error);
  process.exit(1);
});
