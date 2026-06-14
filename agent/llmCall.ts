import { GoogleGenAI } from "@google/genai";
import tools from "./tools.json";

import {
  bashExec,
  summarize,
  webSearch,
  editFile,
} from "./tools";
import axios from "axios";
import { models } from "../models";

const systemPrompt = `
You are a CLI coding agent.

You have access to tools.
Use tools when you need terminal output, file edits, summaries, or web search.

Important rules:
- Do not pretend you executed a command.
- If you need terminal output, call bashExec.
- If you need to edit a file, call editFile.
- After a tool result, continue until you can give the final answer.
- Never run dangerous commands such as rm -rf, sudo, deleting files, or reading secrets.
`;

export async function executeTool(name: string, args: any) {
  if (name === "bashExec") {
    return await bashExec(args.command, args.eventsString);
  }

  if (name === "summarize") {
    return summarize(args.content, args.eventsString);
  }

  if (name === "webSearch") {
    return webSearch(args.query, args.eventsString);
  }

  if (name === "editFile") {
    return editFile(args.filePath, args.edits, args.eventsString);
  }

  throw new Error(`Unknown tool: ${name}`);
}

export async function llmCall(prompt: string, apiKey: string) {
  try {
    const cleanApiKey = apiKey.trim();
    const ai = new GoogleGenAI({
      vertexai: false,
      apiKey:cleanApiKey,
    });
    const data = await axios.get("http:www.localhost:3000/provider/current")
    if(!data){
        return 
    }
    const provider:"openai"|"anthropic"|"google" = data.data.currentProvider
    const model = models[provider].models[0]
    if(!model){
        return
    }

    console.log(model)
    const chat = ai.chats.create({
      model: model,
      config: {
        systemInstruction: systemPrompt,
        tools,
      },
    });

    let response = await chat.sendMessage({
      message: prompt,
    });

    while (response.functionCalls && response.functionCalls.length > 0) {
      const functionResponseParts = [];

      for (const functionCall of response.functionCalls) {
        const toolName = functionCall.name;
        const toolArgs = functionCall.args;

        if (!toolName) {
          continue;
        }

        console.log(`\nCalling tool: ${toolName}`);
        console.log("Args:", toolArgs);

        let toolResult;

        try {
          toolResult = await executeTool(toolName, toolArgs);
        } catch (error: any) {
          toolResult = `Tool execution failed: ${error.message}`;
        }

        functionResponseParts.push({
          functionResponse: {
            name: toolName,
            response: {
              result: toolResult,
            },
          },
        });
      }

      response = await chat.sendMessage({
        message: functionResponseParts,
      });
    }

    console.log(response.text);
    return response.text;
  } catch (error) {
    console.error("LLM call failed:", error);
    return "LLM call failed.";
  }
}