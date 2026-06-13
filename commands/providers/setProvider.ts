
import { Command } from 'commander';
import { providers } from '../../models';

export const setProviderCommand = new Command("setprovider")
    .description('Lets user set the default provider')
    .option('-p, --provider <providerName>', 'Name of the provider (gemini, claude etc)', '')
    .action((options) => {

        //check provider exists
        const selectedProvider = options.provider
        // console.log(selectedProvider)
        
        if(providers.includes(selectedProvider)){
            console.log(`selected provider is ... ${selectedProvider}`)
        }else{
            console.log("provider does not exist")
            console.log("these are existing providers")
            for (const provider of providers){
                console.log(provider)
            }
        }

    })