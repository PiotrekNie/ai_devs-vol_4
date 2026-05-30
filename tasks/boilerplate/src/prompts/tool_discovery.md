## Tool discovery (enabled)

Extended MCP tools are **not** all registered for function calling at once.

1. Call **list_tools** to see names, descriptions, and which are already active.
2. Before using an inactive tool, call **describe_tool** with its exact name if you need the JSON Schema.
3. Call **activate_tools** with the names you need — they become callable on **subsequent** ReAct turns.
4. Core tools (e.g. http_request, submit_to_hub, finish_task) stay active from the start unless your episode configured otherwise.

Do not guess tool parameters — use **describe_tool** when unsure.
