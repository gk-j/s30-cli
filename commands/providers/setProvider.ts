
import { Command } from 'commander';
import { providers } from '../../models';
import axios from 'axios';
import { prisma } from '../../db';

export const setProviderCommand = new Command("setprovider")
    .description('Lets user set the default provider')
    .option('-p, --provider <providerName>', 'Name of the provider (gemini, claude etc)', '')
    .action(async (options) => {

        //check provider exists
        const selectedProvider = options.provider
        // console.log(selectedProvider)
        try {
            const data = await axios.post("http://localhost:3000/provider/set",{
                provider:selectedProvider
            })
            console.log(data.data)
            const provider = data.data.provider
            const apiKey = data.data.apiKey;
            const updateApi = await prisma.current.update({
                where: { provider: provider },
                data: { apiKey: apiKey },
            });

            if(!updateApi){
                let created = await prisma.current.create({
                    data: { provider: provider, apiKey: apiKey, isActive: true },
                    });
                console.log(created)
                console.log(
                    "set provider to ",
                    provider,
                    " here is the api key ",
                    data.data,
                );
            }
        } catch (error) {
            console.log(error)
        }
    })