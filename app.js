import "dotenv/config";

import express from "express";
import http from "http";

import { Server } from "socket.io";
import handlebars from "express-handlebars";
import { faker } from '@faker-js/faker';
import session from 'express-session'
import cookieParser from "cookie-parser";
import MongoStore from "connect-mongo";


import passport from './passport/local-auth.js'
import daosContenedor from "./daos/index.js";
import router from "./routes/routes.js";
import routerRandoms from "./routes/routerRandoms.js";

const runServer = (port) => {

    const app = express();
    
    // ARCHIVOS ESTATICOS
    app.use(express.static("views/layouts"));
    
    // SERVER
    const server = http.createServer(app);
    
    
    
    //SESSION
    app.use(cookieParser());
    app.use(session({
        secret: 'secret',
        cookie: { maxAge: 600000 },
        resave: true,
        rolling: true,
        saveUninitialized: true,
        store: MongoStore.create({
            mongoUrl: "mongodb://localhost:27017/sessions",
            mongoOptions: {
                useNewUrlParser: true,
                useUnifiedTopology: true
            },
        }),
        cookie: {
            maxAge: 600000
        }
    }));
    
    // MIDDLEWARE
    app.use(express.json());
    app.use(express.urlencoded({ extended: true }));
    
    // PASSPORT
    app.use(passport.initialize());
    app.use(passport.session());
    
    
    //ROUTES 
    app.use("/api", routerRandoms);
    app.use("/", router);
    
    
    // Configuracion de handlebars
    app.set("views", "./views");
    app.set("view engine", "hbs");
    app.engine("hbs", handlebars.engine({
        extname: ".hbs",
        defaultLayout: "index",
        layoutsDir: "./views/layouts",
        partialsDir: "./views/partials",
    })
    );
    
    // SERVER SOCKET
    const io = new Server(server);
    
    // SERVER CONECTION
    io.on("connection", (socket) => {
        //Nuevo mensaje para el chat
        socket.on("newMsg", (data) => {
            let newMsg = data;
            daosContenedor.getMessages().then((data) => {
                let mensajes = data.mensajes
                let id = mensajes.length > 0 ? mensajes[mensajes.length - 1].id + 1 : 1;
                newMsg = { ...newMsg, id: id }
                daosContenedor.saveMessage(newMsg).then(() => {
                    console.log("Saved message");
                    daosContenedor.compresion().then((compresion) => {
                        io.sockets.emit("newMsg", { newMsg, compresion });
                    }).catch((err) => {
                        console.log(err)
                    })
                }).catch((err) => {
                    console.log(err)
                })
            }).catch((err) => {
                console.log(err)
            })
        });
        socket.on("complete", () => {
            let user = {
                email: faker.internet.email(),
                nombre: faker.name.firstName(),
                apellido: faker.name.lastName(),
                edad: faker.random.numeric(2),
                alias: faker.internet.userName(),
                avatar: faker.internet.avatar(),
                mensaje: faker.lorem.sentence(10)
            }
            io.sockets.emit("complete", user)
        })
    });
    server.listen(port, () => {
        console.log("listening on port " + port)
    });
    
}

export default runServer;