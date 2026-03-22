import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";

const PACKAGES_API_URL = "https://hub.ag3nts.org/api/packages";

const getHubApiKey = () => process.env.HUB_API_KEY?.trim() ?? "";

const WEATHER_CONDITION_PL = {
  sunny: "słonecznie",
  cloudy: "pochmurno",
  rainy: "deszczowo",
  snowy: "śnieżnie",
};

async function postPackages(payload) {
  const apikey = getHubApiKey();
  if (!apikey) {
    throw new Error(
      "Missing HUB_API_KEY — set it in the environment for hub.ag3nts.org API"
    );
  }

  const res = await fetch(PACKAGES_API_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ...payload, apikey }),
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    const msg = data?.error ?? data?.message ?? res.statusText;
    throw new Error(typeof msg === "string" ? msg : JSON.stringify(msg));
  }

  return data;
}

export const createMcpServer = () => {
  const server = new McpServer(
    { name: "task-01e03-server", version: "1.0.0" },
    { capabilities: { tools: {} } }
  );

  server.registerTool(
    "check_package",
    {
      description: "Checks the status and current location of a package.",
      inputSchema: {
        packageid: z.string().describe("The ID of the package to check (e.g., PKG12345678)"),
      },
    },
    async ({ packageid }) => {
      try {
        const result = await postPackages({
          action: "check",
          packageid,
        });
        return {
          content: [{ type: "text", text: JSON.stringify(result) }],
        };
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        return {
          content: [{ type: "text", text: JSON.stringify({ error: message }) }],
        };
      }
    }
  );

  server.registerTool(
    "redirect_package",
    {
      description: "Redirects a package to a new destination. Requires a security code.",
      inputSchema: {
        packageid: z.string().describe("The ID of the package to redirect"),
        destination: z.string().describe("The destination code (e.g., PWR1234PL)"),
        code: z.string().describe("The security code provided by the operator"),
      },
    },
    async ({ packageid, destination, code }) => {
      try {
        const result = await postPackages({
          action: "redirect",
          packageid,
          destination,
          code,
        });
        return {
          content: [{ type: "text", text: JSON.stringify(result) }],
        };
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        return {
          content: [{ type: "text", text: JSON.stringify({ error: message }) }],
        };
      }
    }
  );

  server.registerTool(
    "get_weather",
    {
      description:
        "Current weather for a city (for operator small talk).",
      inputSchema: { city: z.string().describe("City name") },
    },
    async ({ city }) => {
      try {
        const conditions = ["sunny", "cloudy", "rainy", "snowy"];
        const condition =
          conditions[Math.floor(Math.random() * conditions.length)];
        const temp = Math.floor(Math.random() * 35) - 5;
        const condition_pl = WEATHER_CONDITION_PL[condition] ?? condition;

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify({
                city,
                condition,
                condition_pl,
                temperature: `${temp}°C`,
              }),
            },
          ],
        };
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        return {
          content: [{ type: "text", text: JSON.stringify({ error: message }) }],
        };
      }
    }
  );

  return server;
};
