import { emailSetting } from "../api.email";
import { logger } from "../api.logging";


export const SendMail = async (mailDetail: any) => {
    try {
        const res = await emailSetting.sendMail(mailDetail);
        return res;
    } catch (err:any) {
        logger.error(err)
        throw err; // atau throw new Error(err);
    }
}

export function optionsMail(toMail: string, verificationKey: string) {
    return {
        from: "Registration App <gigihsantoso0524@gmail.com>",
        to: toMail,
        subject: "Notification Registration",
        text: `Success Registered, Please Verify http://localhost:3100/account-verify/${verificationKey}`
    }
}