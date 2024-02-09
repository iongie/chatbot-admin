import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { PromptTemplate } from "@langchain/core/prompts";
import { StringOutputParser } from "@langchain/core/output_parsers";
import { RunnableSequence } from "@langchain/core/runnables";
import { Connection } from "./base";
import moment from "moment";

export const nature = async (model: ChatGoogleGenerativeAI, prompt: string, memory: Connection, userId: string, id:string) => {
    try {
        const dataPrompt = PromptTemplate.fromTemplate
            (`dari {history}, tulis jawaban dalam bentuk natural languange bahasa indonesia dari {question}`)

        const previousChat = await memory.Store().collection(`chatbot-${userId}-${id}`).read()
        const chain = await RunnableSequence.from([
            {
                history: async () => previousChat.data.slice(-3),
                question: (input: { question: string; }) => input.question,
            },
            dataPrompt,
            model,
            new StringOutputParser(),
        ])
       

        const result = await chain.invoke({
            question: prompt,
        });

        await memory.Store().collection(`chatbot-${userId}-${id}`).create({
            "question": prompt,
            "text": result,
            "moment": moment().format('YYYY-MM-DD HH:mm:ss')
        })

        return result
    } catch (error) {
        return "tidak tahu jawabannya"
    }
}