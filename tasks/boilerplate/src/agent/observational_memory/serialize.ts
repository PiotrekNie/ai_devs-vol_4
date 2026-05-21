import {
  OBSERVER_MAX_SECTION_CHARS,
  OBSERVER_MAX_TOOL_PAYLOAD_CHARS,
} from "../../../config.js";
import {
  isFunctionCall,
  isFunctionCallOutput,
  isTextConversationItem,
} from "./types.js";
import { truncate } from "./utils.js";

export function serializeConversationItems(items: unknown[]): string {
  return items
    .map((item, i) => {
      if (isFunctionCallOutput(item)) {
        return `**Tool Result (#${i + 1}):**\n${truncate(item.output, OBSERVER_MAX_TOOL_PAYLOAD_CHARS)}`;
      }

      if (isFunctionCall(item)) {
        return `**Assistant Tool Call (#${i + 1}):**\n[Tool: ${item.name}] ${truncate(item.arguments, OBSERVER_MAX_TOOL_PAYLOAD_CHARS)}`;
      }

      if (isTextConversationItem(item)) {
        const label = item.role.charAt(0).toUpperCase() + item.role.slice(1);
        const content =
          typeof item.content === "string"
            ? item.content
            : item.content != null
              ? JSON.stringify(item.content)
              : "";
        return `**${label} (#${i + 1}):**\n${truncate(content, OBSERVER_MAX_SECTION_CHARS) || "[empty]"}`;
      }

      return "";
    })
    .filter(Boolean)
    .join("\n\n---\n\n");
}
