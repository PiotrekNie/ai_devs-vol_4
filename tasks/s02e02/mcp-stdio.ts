#!/usr/bin/env bun
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { createElectricityMcpServer } from "./src/mcp/server.ts";

const server = createElectricityMcpServer();
await server.connect(new StdioServerTransport());

const exit = async () => {
  await server.close();
  process.exit(0);
};
process.on("SIGINT", exit);
process.on("SIGTERM", exit);
