import { Command, program } from 'commander';
import { loginCommand } from './login';
import { logoutCommand } from './logout';
import { setProviderCommand } from './setProvider';
import { providers } from '../../models';

export const providerCommand = new Command("providers")
    .description("Provider related information")
    .action(()=>{
        for (const provider of providers){
            console.log(provider)
        }
    })
    .addCommand(loginCommand)
    .addCommand(logoutCommand)
    .addCommand(setProviderCommand)