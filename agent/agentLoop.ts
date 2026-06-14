import { GoogleGenAI } from "@google/genai";
import { bashExec, webSearch, editFile } from "./tools";

// ─── 1. TYPES ────────────────────────────────────────────────────────────────
// This describes the exact shape of every object the AI must return.
// "responseAcceptable: yes" means the AI is done and has a final answer.
// "responseAcceptable: no"  means the AI wants to run a tool first.

type ToolCall =
  | { toolName: "exec";       inputs: { command: string };                 responseAcceptable: "yes" | "no"; runningEvent: string; response: string }
  | { toolName: "web_search"; inputs: { query: string };                   responseAcceptable: "yes" | "no"; runningEvent: string; response: string }
  | { toolName: "edit";       inputs: { filePath: string; edits: string }; responseAcceptable: "yes" | "no"; runningEvent: string; response: string }
  | { toolName: "final";      inputs: Record<string, never>;               responseAcceptable: "yes";         runningEvent: string; response: string };

// ─── 2. SYSTEM PROMPT ────────────────────────────────────────────────────────
// This is what tells the AI how to behave.
// The key rule: ALWAYS reply with a JSON array — never plain text.
// One tool call per reply. When done, use toolName "final".

const systemPrompt = `
You are a CLI coding agent. You solve tasks step by step using tools.

STRICT RULES:
- Always respond with a valid JSON array. Never write plain text.
- Make exactly ONE tool call per response.
- When you have enough info to answer, use toolName "final".

Available tools:
- "exec"       → run a terminal command. inputs: { command: string }
- "web_search" → search the web.         inputs: { query: string }
- "edit"       → edit a file.            inputs: { filePath: string, edits: string }
- "final"      → give the final answer.  inputs: {}

Response format (always a JSON array with one object):
[
  {
    "toolName": "exec" | "web_search" | "edit" | "final",
    "inputs": { ... },
    "responseAcceptable": "yes" | "no",
    "runningEvent": "short 4-word description of what you are doing",
    "response": "your final answer here (only fill this when toolName is final)"
  }
]

Rules:
- Set responseAcceptable to "no" when you need to run a tool.
- Set responseAcceptable to "yes" only when toolName is "final" and you have the answer.
- Never run dangerous commands like rm -rf, sudo, or delete.
`;

// ─── 3. PARSE THE AI RESPONSE ────────────────────────────────────────────────
// The AI replies with a string. We extract the JSON from it.
// Sometimes the model wraps JSON in markdown code fences (```json ... ```)
// so we strip those before parsing.

function parseResponse(text: string): ToolCall[] | undefined {
  // Try 1: strip markdown fences and parse directly
  const cleaned = text
    .trim()
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/, "")
    .trim();

  // Try 2: if the AI added prose before/after the JSON, extract the array with regex
  const candidates = [cleaned, (text.match(/\[[\s\S]*\]/) ?? [])[0]];

  for (const candidate of candidates) {
    if (!candidate) continue;
    try {
      const parsed = JSON.parse(candidate);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed as ToolCall[];
      }
    } catch {
      // try next candidate
    }
  }

  console.error("Failed to parse AI response as JSON:", text);
  return undefined;
}

// ─── 4. EXECUTE A SINGLE TOOL CALL ───────────────────────────────────────────
// Takes one ToolCall object and runs the right function.
// Returns the output as a string so it can be fed back to the AI.

async function executeTool(toolCall: ToolCall): Promise<string> {
  const { toolName, inputs, runningEvent } = toolCall;

  switch (toolName) {
    case "exec":
      return await bashExec(inputs.command, runningEvent);

    case "web_search":
      return webSearch(inputs.query, runningEvent);

    case "edit":
      return editFile(inputs.filePath, inputs.edits, runningEvent);

    case "final":
      return toolCall.response;
  }
}

// ─── 5. THE AGENT LOOP ───────────────────────────────────────────────────────
// This is the core. Here's the flow:
//
//   userPrompt
//       ↓
//   ask AI → gets back JSON with one tool call
//       ↓
//   if responseAcceptable === "yes"  →  print response, STOP
//   if responseAcceptable === "no"   →  run the tool, get output
//       ↓
//   feed output back: "Original prompt: ...\nTool output: ..."
//       ↓
//   ask AI again  (repeat until "yes")

export async function agentLoop(userPrompt: string, apiKey: string) {
  const ai = new GoogleGenAI({ apiKey: apiKey.trim() });

  // We build the prompt incrementally.
  // First turn = just the user prompt.
  // Later turns = original prompt + all tool outputs so far.
  let currentPrompt = `Working directory: ${process.cwd()}\nUser request: ${userPrompt}`;

  // Safety cap: stop after 10 iterations to avoid infinite loops.
  const MAX_ITERATIONS = 10;

  for (let i = 0; i < MAX_ITERATIONS; i++) {
    console.log(`\n[Iteration ${i + 1}]`);

    // Call the AI with the current prompt
    const result = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: currentPrompt,
      config: { systemInstruction: systemPrompt },
    });

    const rawText = result.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!rawText) {
      console.error("Empty response from AI.");
      return;
    }

    // Parse the JSON the AI returned
    const toolCalls = parseResponse(rawText);
    if (!toolCalls || toolCalls.length === 0) {
      console.error("Could not parse tool calls from AI response.");
      return;
    }

    // We only process the first tool call (one per turn)
    const toolCall = toolCalls[0];
    if (!toolCall) {
      console.error("Empty tool calls array.");
      return;
    }
    console.log(`Running: ${toolCall.runningEvent} (tool: ${toolCall.toolName})`);

    // If the AI says it's done, print the answer and exit
    if (toolCall.responseAcceptable === "yes") {
      console.log("\n─── Final Answer ───────────────────────────────");
      console.log(toolCall.response);
      return toolCall.response;
    }

    // Otherwise, run the tool and get the output
    const toolOutput = await executeTool(toolCall);
    console.log("Tool output:", toolOutput);

    // Append the tool output to the prompt for the next iteration.
    // The AI will see the original request + everything that happened so far.
    currentPrompt += `\n\nTool used: ${toolCall.toolName}
Inputs: ${JSON.stringify(toolCall.inputs)}
Output: ${toolOutput}`;
  }

  console.error("Agent reached max iterations without a final answer.");
}
