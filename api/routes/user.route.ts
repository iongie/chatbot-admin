import { Request, Response, Router } from "express";
import { logger } from "../api.logging";
import { InitializeApp } from "../services/base";
import { generateRandomString } from "../services/helper";
import { userCreateKeyValidationChain } from "../services/validation";

export const userCreate = async (req: Request, res: Response) => {
    try {
        // inisial BASE
        const memory = InitializeApp({
            database: process.env['ELJEBASE_DB'],
            storage: process.env['ELJEBASE_STORAGE']
        });

        //panggil collection user
        const user = await memory.Store().collection('user');

        //ambil data collection user
        const getUser = (await user.read()).data;

        // cek data user jika tidak kosong, filter data berdasarkan user id
        const checkUser = getUser !== '{}'
            && await JSON.parse(getUser).filter((val: any) => {
                return val.user === req.body.user
            })

        // buata user baru jika collection user kosong atau belum ada userid
        getUser === '{}' || checkUser.length === 0
            && await user.create({
                user: req.body.user,
                apiKey: generateRandomString(64)
            })

        const resUser = await JSON.parse((await user.read()).data).filter((val: any) => {
            return val.user === req.body.user
        })

        res.status(200).json({
            "status": "success",
            "message": resUser
        })
    } catch (err: any) {
        logger.error(`500 - chatbot process - ${err.message}`)
        res.status(500).json({
            "status": "error",
            "message": err.message
        });
    }
}
export const UserRoute = (app: Router) => {
    app.route(`/api/user`)
        .post(
            userCreateKeyValidationChain,
            userCreate
        )
}



