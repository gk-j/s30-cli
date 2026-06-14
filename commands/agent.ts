import {Command} from "commander"
import { prisma } from "../db"
import { agentLoop } from "../agent/agentLoop"


export const agentCommand = new Command("agent")


agentCommand
    .description("Runs the agent")
    .option('-p, --prompt <prompt>','prompt','')
    .action(async (options)=>{
        const userPrompt = options.prompt
        console.log("User prompt is ... " + options.prompt)


        const data = await prisma.current.findMany({
            where:{
                isActive:true
            }
        })
        console.log("database call")
        const activeProvider = data[0]
        if (!activeProvider?.apiKey) {
            console.error("No active API key found. Run provider login/set-provider first.");
            return;
        }

        await agentLoop(userPrompt, activeProvider.apiKey);
    })