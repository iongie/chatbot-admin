import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { PromptTemplate } from "@langchain/core/prompts";
import { StringOutputParser } from "@langchain/core/output_parsers";
import { RunnableSequence } from "@langchain/core/runnables";
import { SqlDatabase } from "langchain/sql_db";
import { Connection } from "./base";
import moment from 'moment';

export const sqlQuery = async (db: SqlDatabase, model: ChatGoogleGenerativeAI, prompt: string, memory: Connection, userId: string,  id:string) => {
    try {
        const sqlQueryPrompt = PromptTemplate.fromTemplate(`Berdasarkan {schema}, tulis kueri SQL dari {question},  `)
        const sqlQueryChain = RunnableSequence.from([
            {
                schema: async () => db.getTableInfo(),
                question: (input: { question: string }) => input.question,
            },
            sqlQueryPrompt,
            model,
            new StringOutputParser().pipe(res => res.match(/```sql([\s\S]*);\n```/)![1].trim()),
        ]);

        const dataPrompt = PromptTemplate.fromTemplate
            (`dari {queryResult}, tolong jadikan dalam bentuk natural languange bahasa indonesia`)

        const chain = await RunnableSequence.from([
            {
                query: sqlQueryChain
            },
            {
                schema: async () => db.getTableInfo(),
                question: (input: { question: string }) => input.question,
                query: (input) => input.query,
                queryResult: (input) => db.run(input.query)
            },
            dataPrompt,
            model,
            new StringOutputParser(),
        ])

        const result = await chain.invoke({
            question: prompt
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