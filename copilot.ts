import { Hono } from "hono";
import { proxy } from "hono/proxy";

const TEMP_TOKEN = `YOUR_TOKEN`;

const getCopilotToken = async () => {
  const r = await fetch(`https://api.github.com/copilot_internal/v2/token`, {
    headers: {
      authorization: `token ${TEMP_TOKEN}`,
      // "user-agent": "Zed/0.180.4 (macos; aarch64)",
      host: "api.github.com",
    },
  }).then((r) => r.json() as Promise<{ token: string }>);

  return r.token;
};

export const copilot = new Hono()
  //
  .all("/", async (c) => {
    return proxy(
      new Request("https://api.individual.githubcopilot.com/chat/completions", {
        method: c.req.method,
        headers: {
          accept: "*/*",
          "copilot-integration-id": "vscode-chat",
          "copilot-vision-request": "true",
          "content-type": "application/json",
          authorization: `Bearer ${await getCopilotToken()}`,
          // "editor-version": "Zed/0.1.0",
          // "user-agent": "Zed/0.186.12 (macos; aarch64)",
          host: "api.githubcopilot.com",
        },
        body: c.req.raw.body,
      })
    );
  });
