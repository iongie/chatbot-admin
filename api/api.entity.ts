import { DataSource } from "typeorm";
import 'dotenv/config';
import "reflect-metadata";
import { InitializeApp } from "./services/base";


const dataSource = new DataSource({
    type: "postgres",
    host: process.env["HOST_DB"],
    port: parseInt(process.env["PORT_DB"]!),
    username: process.env["USERNAME_DB"],
    password: process.env["PASSWORD_DB"],
    database: process.env["ç"],
    synchronize: true,
    logging: false,
    entities: [],
    subscribers: [],
    migrations: [],
    poolSize: 30000,
    entitySkipConstructor: false,
})

const memory = InitializeApp({
    database: process.env['ELJEBASE_DB'],
    storage: process.env['ELJEBASE_DB']
});

export{
    memory,
    dataSource
}