export const providers:string[] = [
    "anthropic","openai","google"
]


export const models = {
    "anthropic":{
        "models":["claude-sonnet-4-6"]
    },
    "openai":{
        "models":["gpt-5.5"]
    },
    "google":{
        "models":["gemini-2.5-flash", "gemini-pro", "gemini-1.5-flash", "gemini-1.5-pro"]
    }
}