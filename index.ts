import { Hono } from "hono";
import { copilot } from "./copilot";

export const app: Hono = new Hono()
  //
  .route("/chat/completions", copilot)
  .route("/v1/chat/completions", copilot);

export default app;
