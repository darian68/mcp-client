import express from "express";
import cors from "cors";
import bodyParser from "body-parser";

import { listTools, callTool, listResources, readResource } from "./mcp.js";
import { chatWithLLM, startChatSession} from "./vertex.js";

const app = express();
app.use(cors());
app.use(bodyParser.json());

function buildSystemInstruction(tools, resources) {
  return `
  You are an AI assistant.

  You can perform actions using tools and read data using resources.

  TOOLS:
  ${tools.map(t => `- ${t.name}: ${t.description}`).join("\n")}

  RESOURCES:
  ${resources.map(r => `- ${r.uri}: ${r.description}`).join("\n")}

  How to use resources:
  If a user asks about their tickets (count, list, status),
  you MUST request the resource first.

  Example:
  User: count my tickets
  Assistant: RESOURCE_REQUEST:tickets://user

  After you receive the resource data,
  respond with a user-friendly answer.

  Rules:
  1) If you need to perform an action, use a tool call.
  2) If you need read-only data, request a resource using:
    RESOURCE_REQUEST:<uri>
  3) Do NOT guess data.
  4) After receiving resource data or tool results, produce a user-friendly answer.
  `;
}
let cachedTools = null;

async function getTools(token) {
  if (!cachedTools) {
    cachedTools = await listTools(token);
  }
  return cachedTools;
}

app.post("/chat", async (req, res) => {
  const tools = await getTools(req.headers.authorization);
  const resources = await listResources(req.headers.authorization);
  const instruction = buildSystemInstruction(tools, resources);
  const chatSession = await startChatSession(instruction, req.body.history, tools);
  let result = await chatSession.sendMessage(req.body.message);
  console.log("Instruction:", instruction);
  while (true) {    
    const llmResponse = result.response;
    const candidate = llmResponse.candidates[0];
    const part = candidate.content.parts[0];

    // 🛠 Tool call
    if (part.functionCall) {
      // Get tool name and args
      const { name, args } = part.functionCall;
      // just to avoid 422 from MCP, in real case we would extract these from the message or ask user for them
      args.category_id = 12;
      args.exact_location = "Unit 2";
      args.source = "internal_form";
      const toolResult = await callTool(req.headers.authorization, name, args);
      // Send tool result back to LLM
      result = await chatSession.sendMessage([
        {
          functionResponse: {
            name: name,
            response: toolResult
          }
        }
      ]);
      continue;
    }
    //  Final response
    const text = part.text;
    return res.json({
      message: text,
      response: candidate.content
    });
  }
});

app.listen(3000, () => {
  console.log("MCP Client running on http://localhost:3000");
});
