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

const model = vertex.getGenerativeModel({ model: "gemini-2.5-pro" });

const result = await model.generateContent("Hello");
const text =
  result.response.candidates[0].content.parts
    .map(p => p.text || "")
    .join("");

console.log(text);