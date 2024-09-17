import cors from "cors";

const clientURL: string = process.env.CLIENT_URL || "";

const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:5174",
  clientURL,
].filter(Boolean) as string[];

export const corsOptions: cors.CorsOptions = {
  origin: allowedOrigins,
  methods: ["GET", "POST", "PUT", "DELETE"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true,
};

export const CHATAPP_TOKEN = "chatAppTS2024";

export const CHATAPP_ADMIN_TOKEN = "AdminTS2024";
