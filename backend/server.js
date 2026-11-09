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

app.use((_, res) => {
  res.status(404).json({ error: "Route not found" });
});

app.use((error, req, res, next) => {
  const status = Number.isInteger(error.status) && error.status >= 400 && error.status < 500
    ? error.status
    : 500;
  if (status === 500) console.error(error);
  const message = error.type === "entity.parse.failed"
    ? "Request body must contain valid JSON"
    : status === 500
      ? "Internal server error"
      : "Invalid request";
  res.status(status).json({ error: message });
});

const port = Number(process.env.PORT);

app.listen(port, () => {
  console.log(`StockFlow API listening on port ${port}`);
});
