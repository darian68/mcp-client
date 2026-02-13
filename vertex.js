import fetch, { Headers, Request, Response } from "node-fetch";

global.fetch = fetch;
global.Headers = Headers;
global.Request = Request;
global.Response = Response;

import { VertexAI } from "@google-cloud/vertexai";

const vertex = new VertexAI({
  project: "gentle-cinema-487104-n9",
  location: "us-central1",
});

const model = vertex.getGenerativeModel({
  model: "gemini-2.5-pro",
});

export async function chatWithLLM(messages, history, tools) {
  try {
    const chat = await model.startChat({
        systemInstruction: `
            You can call tools.
            If required information for a tool is missing, ask the user.
            Once all required information is available, call the appropriate tool.
            Do not guess values.
            `,
        history: history,
        tools: [{
            functionDeclarations: tools.map(t => ({
                name: t.name,
                description: t.description,
                parameters: t.inputSchema
            }))
        }]
    });
    const result = await chat.sendMessage(messages);
    return result.response;
  } catch (err) {
    console.error("VERTEX ERROR:", err);
    throw err;
  }
}

export async function startChatSession(systemInstruction, history, tools) {
    const chat = await model.startChat({
        systemInstruction: systemInstruction,
        history: history,
        tools: [{
            functionDeclarations: tools.map(t => ({
                name: t.name,
                description: t.description,
                parameters: t.inputSchema
            }))
        }]
    });
    return chat;
}
