import { Request, Response, Router } from "express";
import { logger } from "../api.logging";
import { pdftoText } from "../services/file-controller";

const helloData = async (req: Request, res: Response) => {
    try {
        res.status(200).json({
            "status": "success",
            "message": "hello chatbot-aii",
        })
    } catch (err: any) {
        logger.error(`500 - ${err.message}`)
        res.status(500).json({
            "status": "error",
            "message": err.message
        });
    }
}

export const hello = (app: Router) => {
    app.route(`/api/hello`)
        .get(helloData)
}

