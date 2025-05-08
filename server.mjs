import express from 'express';
import { MongoClient } from 'mongodb';
import MongoStore from 'connect-mongo';
import dotenv from 'dotenv';
import {createLogger,format,transports} from 'winston';
import session from 'express-session';
import cookieParser from 'cookie-parser';

// Routes
import { createAuthRoutes } from './routes/auth.js';
import { createFavoritesRoutes } from './routes/favorites.js';
import { createMovieRouter } from './routes/movies.js';
import { createUserRoutes } from './routes/user.js';

// Express setup
const app = express();
const PORT = 3000;

// Body parsing middleware
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cookieParser());

// Logger
const logger=createLogger({
    level:'info',
    format:format.combine(
        format.timestamp(),
        format.json()
    ),
    transports:[
        new transports.Console(),
        new transports.File({filename:'app.log'})
    ]
});
const logAll=function(request,response,next){
    logger.info(`URL being  requested: ${request.url}`);
    next();
}
app.use(logAll);

// MongoDB setup
dotenv.config();
const uri = process.env.ATLAS_URI;
const client = new MongoClient(uri);
const dbName = 'movie_db';
let moviesCollection, usersCollection;
async function connectToDB(){
    try{
        await client.connect();
        console.log("Connected to MongoDB");
        const db = client.db(dbName);
        moviesCollection = db.collection('movies');
        usersCollection = db.collection('users');

        // Listen for runtime connection issues
        client.on('close', () => {
        console.error("MongoDB connection lost");
        });

        client.on('error', (error) => {
            console.error("MongoDB connection error:", error.message);
        });
    } 
    catch(error){
        throw(error);
    }
}

// Session middleware
app.use(session({
    secret: 'your_secret_key',
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({
                clientPromise: client.connect(),
                dbName: dbName,
                collectionName: 'sessions'
            }),
            cookie: { 
                maxAge: 1000 * 60 * 60 * 24 // 1 day (in ms)
            }
}));

// View engine and static assets
app.use(express.static('public'));
app.set('view engine', 'ejs');
app.set('views','./views');

// Alert messages
app.use((req, res, next) => {
    res.locals.successMessage = req.session.successMessage || null;
    res.locals.errorMessage = req.session.errorMessage || null;

    //console.log('Checking if session has errorMessage:', req.session.errorMessage);//debug

    delete req.session.successMessage;
    delete req.session.errorMessage;

    if(req.method === 'GET' && !req.xhr){
        req.session.lastPage = req.originalUrl;
        //console.log('last page: ',req.session.lastPage);//debug
    }

    next();
});

// Start server after DB connects
connectToDB()
.then(() => {
    app.get('/', (req, res) => {
        res.redirect('/movies');
    });
    
    //Routes
    app.use('/', createMovieRouter(moviesCollection, usersCollection));
    app.use('/', createFavoritesRoutes(usersCollection, moviesCollection));
    app.use('/', createUserRoutes(usersCollection, moviesCollection));
    app.use('/', createAuthRoutes(usersCollection));

    //Server
    app.listen(PORT, () => {
        console.log(`Server running at port:${PORT}`);
    });

    //Global error handler
    app.use((error, req, res, next) => {
        console.error(error.stack);

        if(!res.headersSent){
            req.session.errorMessage = error.message || 'Something went wrong!';
            console.error(req.session.errorMessage);
            return res.redirect('/movies');
        }
    
        res.status(500).end();
    });
})
.catch((error) => {
    console.error('MongoDB connection failed. Server not started.', error);
    process.exit(1);
});

//debugging
/*app.get('/test-error', (req, res, next) => {
    try{
        throw new Error('This is a test error!');
    } 
    catch(error){
        error.message = 'something is wrong with me';
        next(error);
    }
});*/

