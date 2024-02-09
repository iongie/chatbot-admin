import { Request, Response, Router } from "express";

import { logger } from "../api.logging";
import { createProject, InitializeApp } from "../services/base";
import { apiKeyAllYouCanAccessValidationChain, validation } from "../services/validation";

const EljebaseCreate = async (req: Request, res: Response) => {
    try {
        res.status(200).json({
            "status": "success",
            "data": await createProject()
        });
    } catch (err: any) {
        logger.error(`500 - upload process - ${err.message}`)
        res.status(500).json({
            "status": "error",
            "message": err.message
        });
    }
}

export const EljebaseRoute = (app: Router) => {
    app.route(`/api/eljebase/${process.env['ALL_YOU_CAN_ACCESS']}`)
    .post(
        apiKeyAllYouCanAccessValidationChain,
        validation,
        EljebaseCreate)
}