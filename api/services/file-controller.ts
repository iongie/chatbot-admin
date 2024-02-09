import multer from "multer";
import PDFParser from "pdf-parse";
import fs from 'fs';
import axios from 'axios';
import * as https from "https";
import { convert } from 'pdf-img-convert';
import { createWorker } from 'tesseract.js';

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, `elje/${process.env['ELJEBASE_STORAGE']}`); // Set the destination folder for uploaded files
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + '-' + file.originalname); // Set the filename
    },
});

const upload = multer({ storage: storage });

const pdfDOcumentParse = async (url: string) => {
    try {
        const httpsAgent = await new https.Agent({
            rejectUnauthorized: false,
        });
        let responseGet = await axios.get(url, { httpsAgent, responseType: 'arraybuffer' });
        const result = await PDFParser(responseGet.data);
        return result.text
    } catch (error: any) {
        throw error;
    }
}

const pdftoText = async (url: string) => {
    try {
        //Unauthorized HTTPS untuk akses HTTP
        const httpsAgent = await new https.Agent({
            rejectUnauthorized: false,
        });
        //GET PDF dari url
        let responseGet = await axios.get(url, { httpsAgent, responseType: 'arraybuffer' });
        
        // KONVERSI PDF ke format Uint8Array
        const outputConvert = await convert(responseGet.data);
        // Prosess create temporary file untuk proses OCR 
        const ocrProcess = await outputConvert.map(async (output, i) => {
            const worker = await createWorker("eng", 1, {
                // logger: m => console.log(m),
            });
            try {
                await fs.writeFileSync(`./temp${i}.png`, output);
                const { data: { text } } = await worker.recognize(`./temp${i}.png`);
                return text
            } catch (error) {
                return error
            } finally {
                await worker.terminate();
                await fs.unlinkSync(`./temp${i}.png`);
            }
        })
        //Menunggu hilngga proses OCR selesai
        const ocrResult = await Promise.all(ocrProcess)

        // mengeluarkan hasil dalam bentuk satu string
        return (await ocrResult).join()
    } catch (error: any) {
        throw error;
    }
}

export {
    upload,
    pdfDOcumentParse,
    pdftoText
}

