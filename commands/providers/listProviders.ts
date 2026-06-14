
import { Command } from 'commander';

import axios from 'axios';

export const listProviderCommand = new Command("list")
    .description('Lets user know the selected provider')
    .action(async () => {

        try {
            const data = await axios.get("http://localhost:3000/providers")
            console.log(data.data.providers)
        } catch (error) {
            console.log(error)
        }
        

    })