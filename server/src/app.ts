import express from 'express';
import 'express-async-errors';
import rateLimit from 'express-rate-limit'
import cors from "cors";
import dotenv from 'dotenv';

//routers
import usersRouter from './routers/usersRouter';


//middlewares
import errorHandlingMiddleware from './middlewares/errorHandlingMiddleware';
import responseEnhancer from './middlewares/responseEnhancer';

//brings in the process.env variables
dotenv.config({
    path: '../.env'
});

if (!process.env.ENVIRONMENT_TYPE || !['production', 'beta', 'alpha'].includes(process.env.ENVIRONMENT_TYPE)) {
    console.error(`ENVIRONMENT_TYPE not recognized`);
    process.exit(0);
}

verifyDatabaseConnection();

const port = 5050;
const APP = express();

APP.set('trust proxy', 1); //we have one proxy which is the NGINX route from port 443 to 5050
APP.get('/ip', (request, response) => response.send(`Your IP Address is --> ${request.ip}`));

const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 300, // Limit each IP to 300 requests per `window` (here, per 15 minutes), which becomes an average of 1 request every 3 seconds, which is plenty
    standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
    legacyHeaders: false, // Disable the `X-RateLimit-*` headers
    // store: ... , // Use an external store for more precise rate limiting
});

APP.use(limiter);

//@ts-ignore
APP.use(responseEnhancer);

APP.use(cors());
APP.use(express.json({
    limit: '10mb' //any JSON request larger than this ought to throw a 413 Entity Too Large error 
}));

APP.use('/users', usersRouter);

//for testing to see if the App is up
APP.get('/test', async (req, res) => {
    return res.status(200).send(`<h1>Yes, I'm here! This is ${process.env.ENVIRONMENT_TYPE}</h1><p>current version: N/A</p>`);
});

APP.use(errorHandlingMiddleware);

APP.listen(port, () => {
    return;
});

async function verifyDatabaseConnection() {
    try {
        await prisma.$connect();
        console.log('Database connected successfully.');
    } catch (error) {
        console.error('Error connecting to the database:', error);
        process.exit(0);
    } finally {
        await prisma.$disconnect();
    }
};