#!/usr/bin/env node

import "dotenv/config";

import { Hono } from "hono";
import { copilot } from "./copilot";
import { cors } from "hono/cors";
import { serve } from "@hono/node-server";

export const app: Hono = new Hono()
  //
  .use(cors())
  .route("/chat/completions", copilot)
  .route("/v1/chat/completions", copilot);

const port = Number(process.env.PORT ?? 6229);

serve({
  fetch: app.fetch,
  port,
});

console.log(`gh-copilot-proxy listening on http://localhost:${port}`);
