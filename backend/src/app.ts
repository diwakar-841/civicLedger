import express from "express";
import cors from "cors";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import hpp from "hpp";
import routes from "./routes";
import { errorHandler, notFoundHandler } from "./middlewares/errorHandler";
import { apiLimiter } from "./middlewares/rateLimit";
import { allowedOrigins, env } from "./config/env";
import { logger } from "./lib/logger";

export const app = express();

app.disable("x-powered-by");
app.set("trust proxy", 1);

const rpcOrigin = (() => {
  try {
    const u = new URL(env.RPC_URL);
    return `${u.protocol}//${u.host}`;
  } catch {
    return env.RPC_URL;
  }
})();

app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'"],
        styleSrc: ["'self'"],
        imgSrc: ["'self'", "data:"],
        connectSrc: ["'self'", rpcOrigin],
        fontSrc: ["'self'"],
        objectSrc: ["'none'"],
        mediaSrc: ["'self'"],
        frameSrc: ["'none'"]
      }
    }
  })
);
app.use(
  cors({
    origin: allowedOrigins,
    credentials: true
  })
);
app.use(cookieParser());
app.use(hpp());

app.use(express.json({ limit: "1mb" }));

app.use((req, res, next) => {
  const start = Date.now();
  res.on("finish", () => {
    logger.info("request", {
      method: req.method,
      path: req.path,
      status: res.statusCode,
      ms: Date.now() - start
    });
  });
  next();
});

app.use(apiLimiter);

app.get("/health", (_req, res) => {return res.json({ status: "ok" });});
app.use("/api", routes);

app.use(notFoundHandler);
app.use(errorHandler);