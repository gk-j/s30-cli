import { exec } from "child_process";

const MAX_OUTPUT_CHARS = 3000;

function truncate(output: string): string {
  if (output.length <= MAX_OUTPUT_CHARS) return output;
  return output.slice(0, MAX_OUTPUT_CHARS) + `\n...[truncated, ${output.length} chars total]`;
}

export async function bashExec(
  command: string,
  eventsString: string
): Promise<string> {
  console.log("......" + eventsString);
  console.log("<======== Command is =========>");
  console.log(command);

  return new Promise((resolve) => {
    const child = exec(command, { cwd: process.cwd() }, (error, stdout, stderr) => {
      if (error) {
        resolve(truncate(`Execution error: ${error.message}`));
        return;
      }
      if (stderr) {
        resolve(truncate(`Standard error: ${stderr}`));
        return;
      }
      resolve(truncate(stdout || "Command executed successfully with no output."));
    });

    // Kill the command if it runs longer than 15 seconds
    setTimeout(() => {
      child.kill();
      resolve("Command timed out after 15 seconds.");
    }, 15000);
  });
}

export function summarize(
  content: string,
  eventsString: string
): string {
  console.log("......" + eventsString);

  return `Summary request received for content:\n${content}`;
}

export function webSearch(
  query: string,
  eventsString: string
): string {
  console.log("......" + eventsString);

  return `Web search is not implemented yet. Query was: ${query}`;
}

export async function editFile(
  filePath: string,
  edits: string,
  eventsString: string
): Promise<string> {
  console.log("......" + eventsString);

  try {
    await Bun.write(filePath, edits);
    return `Successfully wrote to ${filePath}`;
  } catch (err: any) {
    return `Failed to write file: ${err.message}`;
  }
}