import nodemailer from 'nodemailer';

export const emailSetting = nodemailer.createTransport({
    service: process.env['SERVICE_EMAIL'],
    host: process.env['HOST_EMAIL'],
    port: parseInt(process.env['PORT_EMAIL']!),
    secure: false,
    auth: {
        user: process.env['USERNAME_EMAIL'],
        pass: process.env['PASSWORD_EMAIL'],
    },
})