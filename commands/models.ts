import { Command } from 'commander';
import { models } from '../models';
import axios from 'axios';
export const modelCommand = new Command("models");

modelCommand
    .description("return all the supported models")
    .option('-m, --model <modelName>','name of the model','all')
    .action(async(options)=>{
        console.log("Listing the models")
        const data = await axios.get("http://localhost:3000/provider/current")
        console.log("current provider set to ",data.data.currentProvider)
        const provider:"openai"|"anthropic"|"google" = data.data.currentProvider
        for (const model of models[provider].models){
            console.log(model)
        }
        
    })
    
