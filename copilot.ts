import { Hono } from "hono";
import { proxy } from "hono/proxy";

const COPILOT_TOKEN = process.env.COPILOT_TOKEN;
const AZURE_API_KEY = process.env.AZURE_API_KEY;
const AZURE_BASE_URL = process.env.AZURE_BASE_URL;

// Token cache with 30-minute expiration
let tokenCache: { token: string; timestamp: number } | null = null;
const CACHE_DURATION = 30 * 60 * 1000; // 30 minutes in milliseconds

const getCopilotToken = async () => {
  // Check if we have a valid cached token
  if (tokenCache && (Date.now() - tokenCache.timestamp) < CACHE_DURATION) {
    return tokenCache.token;
  }

  // Fetch new token
  console.log('Fetching new Copilot token');
  const r = await fetch(`https://api.github.com/copilot_internal/v2/token`, {
    headers: {
      authorization: `token ${COPILOT_TOKEN}`,
      "user-agent": "Zed/0.180.4 (macos; aarch64)",
      host: "api.github.com",
    },
  }).then((r) => r.json() as Promise<{ token: string }>);

  // Cache the new token
  tokenCache = { token: r.token, timestamp: Date.now() };

  return r.token;
};

export const copilot = new Hono()
  //
  .all("*", async (c) => {
    const pathname = c.req.path;
    const method = c.req.method;

    const body = await c.req.json()

    const model = body.model

    console.log(`[${method}] Copilot request to ${pathname} with model ${model}`);

    const AZURE_MODELS = [
      "o3",
      "o4-mini"
    ]

    if (AZURE_MODELS.includes(model) && AZURE_BASE_URL && AZURE_API_KEY) {
      return proxy(
        new Request(`${AZURE_BASE_URL}/openai/deployments/${model}/chat/completions?api-version=2025-01-01-preview`, {
          method: c.req.method,
          headers: {
            accept: "*/*",
            "content-type": "application/json",
            authorization: `Bearer ${AZURE_API_KEY}`,
          },
          body: JSON.stringify({
            ...body,
          }),
        })
      );
    }

    const token = await getCopilotToken()

    return proxy(
      new Request(`https://api.individual.githubcopilot.com/chat/completions`, {
        method: c.req.method,
        headers: {
          accept: "*/*",
          "copilot-integration-id": "vscode-chat",
          "copilot-vision-request": "true",
          "content-type": "application/json",
          authorization: `Bearer ${token}`,
          "editor-version": "Zed/0.1.0",
          "user-agent": "Zed/0.186.12 (macos; aarch64)",
          host: "api.githubcopilot.com",
        },
        body: JSON.stringify({
          ...body,
        }),
      })
    );
  });
