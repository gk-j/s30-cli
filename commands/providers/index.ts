import { Command, program } from 'commander';
import { loginCommand } from './login';
import { logoutCommand } from './logout';
import { setProviderCommand } from './setProvider';
import { providers } from '../../models';
import { getProviderCommand } from './getProvider';
import { listProviderCommand } from './listProviders';

export const providerCommand = new Command("providers")
    .description("Provider related information")
    .action(()=>{
        for (const provider of providers){
            console.log(provider)
        }
    })
    .addCommand(getProviderCommand)
    .addCommand(listProviderCommand)
    .addCommand(loginCommand)
    .addCommand(logoutCommand)
    .addCommand(setProviderCommand)
