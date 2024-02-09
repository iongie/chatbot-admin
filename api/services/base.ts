import * as fs from 'fs';
import * as crypto from 'crypto';
import { promisify } from 'util';
import { Transform, pipeline } from 'stream';
import { encrypt, decrypt, generateRandomString } from './helper';

const mkdirAsync = promisify(fs.mkdir);
const readdirAsync = promisify(fs.readdir);
const unlinkAsync = promisify(fs.unlink);
const rmdirAsync = promisify(fs.rmdir);
const writeFileAsync = promisify(fs.writeFile);
const readFileAsync = promisify(fs.readFile);
const renameAsync = promisify(fs.rename);
const pipelineAsync = promisify(pipeline);
  
export async function createProject(): Promise<any> {
    try {
        const folderDb = crypto.randomBytes(10).toString('hex');
        const dbName = crypto.randomBytes(16).toString('hex');
        const storage = crypto.randomBytes(16).toString('hex');
        
        await !fs.existsSync(`./elje`) && mkdirAsync(`./elje`);
        await mkdirAsync(`./elje/${folderDb}`);
        await mkdirAsync(`./elje/${storage}`);
        await writeFileAsync(`./elje/${folderDb}/${dbName}.eljebe`, '{}');
        const data = {
            database: `${folderDb}.${dbName}`,
            storage: storage,
            key: generateRandomString(64)
        };
        return data;
    } catch (error) {
        return error;
    }
}

export async function deleteProject(config: any): Promise<string> {
    try {
        const folderDb = config.database.slice(0, 20);
        // !delete database
        const dbFiles = await readdirAsync(`./elje/${folderDb}`);
        await Promise.all(dbFiles.map(async x => {
            await unlinkAsync(`./elje/${folderDb}/${x}`);
        }));
        await rmdirAsync(`./elje/${folderDb}`);

        // !delete storage
        const storageFiles = await readdirAsync(`./elje/${config.storage}`);
        await Promise.all(storageFiles.map(async x => {
            await unlinkAsync(`./elje/${config.storage}/${x}`);
        }));
        await rmdirAsync(`./elje/${config.storage}`);
        return 'Delete Project Successfully';
    } catch (err: any) {
        return err.message;
    }
}

export function InitializeApp(config: any): Connection {
    return new Connection(config);
}

export class Connection {
    private config: any;

    constructor(config: any) {
        this.config = config;
    }

    public Store(): ActionStore {
        return new ActionStore(this.config);
    }
}

class ActionStore {
    private database: string;
    private tempDatabase: string;
    private ak: string;

    constructor(config: any) {
        const dirDb = config.database.slice(0, 20);
        const fileDb = config.database.slice(21, config.database.length);
        this.database = `./elje/${dirDb}/${fileDb}.eljebe`;
        this.tempDatabase = `./elje/${dirDb}/temp${fileDb}.eljebe`;
        this.ak = config.apiKey;
    }

    public collection(collection: string): Collection {
        return new Collection(collection, this.database, this.tempDatabase, this.ak);
    }
}

class Collection {
    private collection: string;
    private db: string;
    private tempDb: string;

    constructor(collection: string, db: string, tempDb: string, apiKey: string) {
        this.collection = collection;
        this.db = db;
        this.tempDb = tempDb;
    }

    public async create(data: any): Promise<{ status: string, message: string }> {
        try {
            const collection = await this.collection;
            const readFileStreamTransform = await new Transform({
                transform(chunck, encoding, callback) {
                    let x = JSON.parse(chunck.toString());
                    data['uuid'] = crypto.randomUUID({
                        disableEntropyCache: true
                    });
                    if (x[collection] == undefined) {
                        x[collection] = [];
                        x[collection].push(data);
                    } else {
                        x[collection].push(data);
                    }
                    this.push(JSON.stringify(x))
                    callback();
                }
            });
            await pipelineAsync(
                fs.createReadStream(this.db),
                readFileStreamTransform,
                fs.createWriteStream(this.tempDb)
            );

            await unlinkAsync(this.db);
            await renameAsync(this.tempDb, this.db);

            return {
                status: 'success',
                message: 'Data Added Successfully'
            };
        } catch (err: any) {
            return {
                status: 'error',
                message: err.message
            };
        }
    }

    public async read(): Promise<{ status: string, data?: any, message?: string }> {
        try {
            const collection = await this.collection;
            
            const readFileStreamTransform = await new Transform({
                transform(chunck, encoding, callback) {
                    const v = JSON.parse(chunck.toString())[collection];
                    const x = v == undefined ?
                        [] :
                        JSON.parse(chunck.toString())[collection];
                    this.push(JSON.stringify(x))
                    callback();
                }
            });

            const data = await new Promise<{ status: string, data?: any, message?: string }>((resolve, reject) => {
                readFileStreamTransform.on('data', chunck => {
                    const result = {
                        status: 'success',
                        data: chunck.toString()
                    };
                    resolve(result);
                });

                pipeline(
                    fs.createReadStream(this.db),
                    readFileStreamTransform,
                    (err) => {
                        if (err) {
                            const errorResult = {
                                status: 'error',
                                message: err.message
                            };
                            reject(errorResult);
                        }
                    }
                );
            });

            return data;
        } catch (err: any) {
            return {
                status: 'error',
                message: err.message
            };
        }
    }

    public async update(id: string, data: any): Promise<{ status: string, message?: string }> {
        try {
            const collection = this.collection;
            const readFileStreamTransform = new Transform({
                transform(chunck, encoding, callback) {
                    const x = JSON.parse(chunck.toString());
                    data['uuid'] = id;
                    const filterSameId = x[collection].filter((x:any) => x.uuid == id);
                    filterSameId[0] = data;
                    const filterNoSameId = x[collection].filter((x:any) => x.uuid != id);
                    x[collection] = filterNoSameId;
                    x[collection].push(filterSameId[0]);
                    this.push(JSON.stringify(x))
                    callback();
                }
            });

            await pipeline(
                fs.createReadStream(this.db),
                readFileStreamTransform,
                fs.createWriteStream(this.tempDb)
            );

            await unlinkAsync(this.db);
            await renameAsync(this.tempDb, this.db);

            return {
                status: 'success',
                message: 'Data Updated Successfully'
            };
        } catch (err: any) {
            return {
                status: 'error',
                message: err.message
            };
        }
    }

    public async delete(id: string): Promise<{ status: string, message?: string }> {
        try {
            const collection = this.collection;
            const readFileStreamTransform = new Transform({
                transform(chunck, encoding, callback) {
                    let x = JSON.parse(chunck.toString());
                    const filter = x[collection].filter((x:any) => x.uuid != id);
                    x[collection] = filter;
                    x[collection].length == 0 && delete x[collection];
                    this.push(JSON.stringify(x))
                    callback();
                }
            });

            await pipeline(
                fs.createReadStream(this.db),
                readFileStreamTransform,
                fs.createWriteStream(this.tempDb)
            );

            await unlinkAsync(this.db);
            await renameAsync(this.tempDb, this.db);

            return {
                status: 'success',
                message: 'Data Deleted Successfully'
            };
        } catch (err: any) {
            return {
                status: 'error',
                message: err.message
            };
        }
    }
}
