import { Request, Response, NextFunction } from "express";
import { ValidationChain, body, header, validationResult } from "express-validator";
import { logger } from "../api.logging";
import { InitializeApp } from "./base";



function validation(req: Request, res: Response, next: NextFunction) {
    const result = validationResult(req);
    if (!result.isEmpty()) {
        logger.error(result)
        return res.status(400).json({
            "status": "error",
            "message": result
        });
    }

    next();
    return
}

const apiKeyAllYouCanAccessValidationChain: ValidationChain[] = [
    header('x-api-key')
        .not()
        .isEmpty().withMessage('API-KEY is required')
        .bail()
        .custom((val) => {
            if (val !== '42252393a2895a4e3da376a2b224ce2c') {
                throw new Error('Invalid API key');
            }
            return true;
        })
]

const apiKeyValidationChain: ValidationChain[] = [
    header('x-api-key')
        .not()
        .isEmpty().withMessage('API-KEY is required')
        .bail()
        .custom(async (val) => {
            try {
                const memory = InitializeApp({
                    database: process.env['ELJEBASE_DB'],
                    storage: process.env['ELJEBASE_DB']
                });
                const user = await memory.Store().collection('user');
                const getUser = (await user.read()).data;
                if (getUser === '{}') {
                    throw new Error('User Not Found');
                }
                const existingUser = await JSON.parse(getUser).filter((userVal: any) => {
                    return userVal.apiKey === val
                })

                if (existingUser.length === 0) {
                    throw new Error('Invalid API key');
                }

                return true;
            } catch (error: any) {
                throw new Error(error);
            }
        })
]

const userCreateKeyValidationChain: ValidationChain[] = [
    header('x-api-key')
        .not()
        .isEmpty().withMessage('USER-CREATE-API-KEY is required')
        .bail()
        .custom((val) => {
            if (val !== process.env['ELJEBASE_KEY']) {
                throw new Error('Invalid API key');
            }
            return true;
        })
]


const registerValidationChain: ValidationChain[] = [
    body('username')
        .not()
        .isEmpty().withMessage('Username is required!'),
    body('password')
        .not()
        .isEmpty().withMessage('Password is required!')
        .bail()
        .custom((val) => {
            if (!/^(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]+$/.test(val)) {
                throw new Error('Password must contain uppercase letters, numbers, and special characters');
            }
            return true
        }),
    body('fullName')
        .not()
        .isEmpty().withMessage('Name is required!'),
    body('email')
        .not()
        .isEmpty().withMessage('Email is required')
        .bail()
        .isEmail().withMessage('Email format not valid!'),
    body('phoneNumber')
        .not()
        .isEmpty().withMessage('Phone Number is required!'),
    body('address')
        .not()
        .isEmpty().withMessage('Address is required!')
]

export {
    validation,
    apiKeyAllYouCanAccessValidationChain,
    apiKeyValidationChain,
    userCreateKeyValidationChain,
    registerValidationChain
}