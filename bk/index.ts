import {prisma} from "../db"
import express from "express"
import {models,providers} from "../models"
const app = express()

app.use(express.json())

// export const providers:string[] = [
//     "anthropic","openai","google"
// ]

// const models = {
//     "anthropic":{
//         "model":"claude-sonnet-4-6"
//     },
//     "openai":{
//         "model":"gpt-5.5"
//     },
//     "google":{
//         "model":"gemini-2.5-flash-lite"
//     }
// }


let currentProvider : "openai"|"google"|"anthropic" = "openai"
let currentModel = models[currentProvider].models



app.post("/user/login",async (req,res)=>{
    try {
        const { provider, api_key } = req.body
        const providerExists = await prisma.current.findFirst({
            where:{
                provider
            }
        })
        if(providerExists){
            await prisma.current.update({where: {provider:provider}, data:{apiKey:api_key}})
        }else{
            await prisma.current.create({data:{provider: provider, apiKey:api_key, isActive:false}})
        }
        console.log("logged in to ", provider , "with API key ", api_key)
        return res.status(200).send({provider:provider ,api_key: api_key})
    } catch (error) {
        console.log(error)
        return res.json({"message":"error logging in please try again"})
    }
})


app.post("/user/logout",async (req,res)=>{
    try {
        const {provider} = req.body
        console.log("logged out of ", provider )
        return res.status(200).send({message: `logged out of ${provider}` })
    } catch (error) {
        
    }
})

app.get("/providers",(req,res)=>{
    try {
        return res.json({providers})
    } catch (error) {
        
    }
})

app.get("/provider/current",(req,res)=>{
    try {
        return res.json({currentProvider})
    } catch (error) {
        
    }
})

app.post("/provider/set",async(req,res)=>{
    try {
        const {provider} = req.body
        currentProvider = provider
        const data = await prisma.current.findUnique({where: {provider: provider}})

        if(data?.apiKey){
            await prisma.current.update({where: {provider:provider}, data: {isActive:true}})
        }
        console.log("set provider to ", provider, "having api ", data?.apiKey)
        return res.status(200).send({provider: provider, apiKey: data?.apiKey})
    } catch (error) {
        return res.status(500).json({"message":"error setting the provider please try again"})
    }
})







app.listen(3000,()=>{
    console.log("server running at port 3000")
})