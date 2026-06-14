
import { Command } from 'commander';
import { prisma } from '../../db';

export const loginCommand = new Command("login")
    .description('Lets user login into the provider (use it as default)')
    .option('-p, --provider <providerName>', 'Name of the provider (gemini, claude etc)', '')
    .option('-a, --api_key <apiKey>', 'Your api key', '')
    .action(async(options) => {
        const provider = options.provider;
        const apiKey = options.api_key;

        if (!provider || !apiKey) {
            console.error("Provider and API key are required.");
            return;
        }

        try {
            await prisma.current.updateMany({
                where: { provider: { not: provider } },
                data: { isActive: false },
            });
            await prisma.current.upsert({
                where: { provider },
                update: { apiKey, isActive: true },
                create: { provider, apiKey, isActive: true },
            });
            console.log(`Saved API key for provider: ${provider}`);
        } catch (error) {
            console.error("Failed to save API key:", error);
        }
    })