import { ChatGoogleGenerativeAI } from "@langchain/google-genai";

export const model = new ChatGoogleGenerativeAI({
    modelName: "gemini-pro",
    temperature: 0.1,
    apiKey: process.env['GOOGLE_API_KEY'],

});