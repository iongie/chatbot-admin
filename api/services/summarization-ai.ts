import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { PromptTemplate } from "@langchain/core/prompts";
import { StringOutputParser } from "@langchain/core/output_parsers";
import { RunnableSequence } from "@langchain/core/runnables";
import { Connection } from "./base";
import { pdftoText } from "./file-controller";
import moment from "moment";

export const summarization = async (model: ChatGoogleGenerativeAI, prompt: string, memory: Connection, userId: string, id: string) => {
    try {
        const dataPrompt = PromptTemplate.fromTemplate
            (`buat summary dalam bentuk natural languange bahasa indonesia dari {question}`)

        const resUrlFIletoParseText = await pdftoText(prompt)
        
        const chain = await RunnableSequence.from([
            {
                question: (input: { question: string; }) => input.question,
            },
            dataPrompt,
            model,
            new StringOutputParser(),
        ])
       

        const result = await chain.invoke({
            question: resUrlFIletoParseText,
        });

        await memory.Store().collection(`chatbot-${userId}-${id}`).create({
            "question": prompt,
            "text": result,
            "moment": moment().format('YYYY-MM-DD HH:mm:ss')
        })

        return result
    } catch (error) {
        return "data tidak ditemukan"
    }
}