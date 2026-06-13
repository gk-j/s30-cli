import { Command } from 'commander';
import { providers } from '../models';
export const modelCommand = new Command("models");

modelCommand
    .description("return all the supported models")
    .option('-m, --model <modelName>','name of the model','all')
    .action((options)=>{
        console.log("Listing the models")
        console.log(providers)
        console.log(options)
    })
    
