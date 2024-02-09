import { Request, Response, Router } from "express";
import { SqlDatabase, } from "langchain/sql_db";
import { apiKeyValidationChain, validation } from "../services/validation";
import { logger } from "../api.logging";
import { dataSource, memory } from "../api.entity";
import { sqlQuery } from "../services/sql-query-ai";
import { nature } from "../services/nature-ai";
import { InitializeApp } from "../services/base";
import { summarization } from "../services/summarization-ai";
import moment from "moment";
import { upload } from "../services/file-controller";
import { model } from '../api.ai';

export const chatbotSql = async (req: Request, res: Response) => {
    try {

        const db = await SqlDatabase.fromDataSourceParams({
            appDataSource: dataSource,
            ignoreTables: ['trnourut_calon']
        });

        const type = req.body.type
        const resultSummarization = type === 'file'
            ? await summarization(model, req.body.prompt, memory, `${req.headers['user-id']}`, `${req.headers['id']}`)
            : await sqlQuery(db, model, req.body.prompt, memory, `${req.headers['user-id']}`, `${req.headers['id']}`)
        const resultNature = resultSummarization === "Data tidak ditemukan" ? await nature(model, req.body.prompt, memory, `${req.headers['user-id']}`, `${req.headers['id']}`) : undefined;

        res.status(200).json({
            "status": "success",
            "question": req.body.prompt,
            "text": resultSummarization !== 'data tidak ditemukan' ? resultSummarization : resultNature,
            "moment": moment().format('YYYY-MM-DD HH:mm:ss')
        })
    } catch (err: any) {
        logger.error(`500 - chatbot process - ${err.message}`)
        res.status(500).json({
            "status": "error",
            "message": err.message
        });
    }
}

export const chatbotFileUpload = async (req: Request, res: Response) => {
    try {
        const fileName = req.file ? req.file.filename : null;
        const resultSummarization = await summarization(model, `http://localhost:3100/image/${process.env['ELJEBASE_STORAGE']}/${fileName}`, memory, `${req.headers['user-id']}`, `${req.headers['id']}`)

        res.status(200).json({
            "status": "success",
            "question": `http://localhost:3100/image/${process.env['ELJEBASE_STORAGE']}/${fileName}`,
            "text": resultSummarization,
            "moment": moment().format('YYYY-MM-DD HH:mm:ss')
        })
    } catch (err: any) {
        logger.error(`500 - chatbot file Upload process - ${err.message}`)
        res.status(500).json({
            "status": "error",
            "message": err.message
        });
    }
}

export const chatbotRead = async (req: Request, res: Response) => {
    try {
        const initDB = InitializeApp({
            database: process.env['ELJEBASE_DB'],
            storage: process.env['ELJEBASE_DB']
        });
        const result$ = await initDB.Store().collection(`chatbot-${req.headers['user-id']}-${req.headers['id']}`).read()
        res.status(200).json({
            "status": "success",
            "data": JSON.parse(result$.data)
        });
    } catch (err: any) {
        logger.error(`500 - chatbot process - ${err.message}`)
        res.status(500).json({
            "status": "error",
            "message": err.message
        });
    }
}

export const AssistantRoute = (app: Router) => {
    app.route(`/api/assistant`)
        .post(
            apiKeyValidationChain,
            validation,
            chatbotSql
        )
        .get(
            apiKeyValidationChain,
            validation,
            chatbotRead
        )
    app.route(`/api/assistant-upload-file`)
        .post(
            apiKeyValidationChain,
            validation,
            upload.single('document'),
            chatbotFileUpload
        )
}



