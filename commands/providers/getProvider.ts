
import { Command } from 'commander';
import { providers } from '../../models';
import axios from 'axios';

export const getProviderCommand = new Command("getprovider")
    .description('Lets user know the selected provider')
    // .option('', 'Name of the provider (gemini, claude etc)', '')
    .action(async (options) => {

        //check provider exists
        const selectedProvider = options.provider
        // console.log(selectedProvider)
        try {
            const data = await axios.get("http://localhost:3000/provider/current")
            console.log(data.data)
        } catch (error) {
            console.log(error)
        }
        

    })