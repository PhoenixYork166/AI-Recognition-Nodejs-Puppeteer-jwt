const express = require('express');
const session = require('express-session');

const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');
const cors = require('cors');
/* CORS setup Middleware */
const corsSetup = require('./middleware/cors-setup');

const db = require('./util/database');
const fetch = require('node-fetch');

const profile = require('./controllers/profile');

const rootDir = require('./util/path');
require('dotenv').config({ path: `${rootDir}/.env`});

const { printDateTime } = require('./util/printDateTime');
// 2. Test PostgreSQL connection
const { testDbConnection } = require('./util/testDbConnection');
testDbConnection(db);

const app = express(); 
const isProduction = process.env.NODE_ENV === 'production';

// Middleware 
// 1. Requests Logging
const logger = require('./middleware/requestLogger');

// 2. Blocking all Public IP access except whitelisted Public IPs
const checkWhitelist = require('./middleware/checkWhitelist');
app.use(checkWhitelist);

console.log(`\n\nprocess.env.POSTGRES_HOST:\n${process.env.POSTGRES_HOST}\n\nprocess.env.POSTGRES_USER:\n${process.env.POSTGRES_USERNAME}\n\nprocess.env.POSTGRES_PASSWORD:\n${process.env.POSTGRES_PASSWORD}\n\n\nprocess.env.POSTGRES_DB:\n${process.env.POSTGRES_DB}\n\n\nprocess.env.POSTGRES_PORT:\n${process.env.POSTGRES_PORT}\n\nprocess.env.NODE_ENV:\n${process.env.NODE_ENV}\n`);

// Express middleware for Prod
/* Local dev Middleware for CORS (Cross-Origin-Resource-Sharing) */
const corsOptions = {
    origin: function (origin, callback) {
        const allowedOrigins = ['http://localhost:3000'];
        if (process.env.NODE_ENV === 'production') {
            allowedOrigins.push('https://www.ai-recognition-frontend.com')
        }
        if (allowedOrigins.indexOf(origin) !== -1) {
            callback(null, true);
        } else {
            callback(new Error(`\nNot allowed by CORS`));
        }
    },
    credentials: true, // to support session cookies
    methods: ['GET', 'POST', 'PUT', 'OPTIONS', 'HEAD'],
    allowedHeaders: ['Content-Type', 'Authorization']
};
app.use(cors(corsOptions));

// app.use(corsSetup);

app.use(bodyParser.json({ limit: '100mb' }));
app.use(cookieParser());

/* Session cookies */
app.use(session({
    secret: process.env.COOKIE_SECRET, // Secret key to sign the session ID cookie
    resave: false, // Do not force the session to be saved back to session store
    saveUninitialized: false, // true = Do not force an uninitialized session to be saved to the store
    cookie: { 
        secure: isProduction ? true : false,
        httpOnly: isProduction ? true : false,
        // domain: isProduction ? 'www.ai-recognition-backend.com' : 'localhost',
        // path: '/',
        expires: new Date(Date.now() + 900000), // Session cookie will be removed when user closes browser
        maxAge: 900000, // Expires after 15 min
        sameSite: isProduction ? 'None' : 'Lax' // 'None' for cross-site requests
    }
}));

/* Handling User's 'signin' from React */
app.get('/api/get-user-data', (req, res) => {
    console.log(`\nSession: `, req.session);
    if (req.session && req.session.user) {
        return res.status(201).json(req.session.user);
    } else {
        return res.status(403).json({ success: false, status: { code: 403 }, message: `Not authenticated` });
    }
});

// Will need either app.use(express.json()) || app.use(bodyParser.json()) to parse json 
app.use(express.json()); 

// ** Express Middleware for Logging HTTP Requests **
app.use(logger);


/* importing Express routers */
const authRoutes = require('./routes/authRoutes');
const recordsRoutes = require('./routes/records');
const imageRoutes = require('./routes/images');
const webScrapRoutes = require('./routes/webScrapRoute');

/* User's auth routes for rootDir/controllers/authen */
app.use(authRoutes);

/* User's records routes for rootDir/controllers/records */
app.use('/records', recordsRoutes);

/* Image routes for rootDir/controllers/image */
app.use(imageRoutes);

/* Web Scraper routes for rootDir/controllers/webScrap */
app.use(webScrapRoutes);

// create /profile/:id route
// app.post('/profile/:id', (req, res) => { profile.handleProfileGet(req, res, db) } );

// For Users to download records to .pdf files to their devices
// app.post('/save-html', async(req, res) => { webScrap.saveHtml(req, res, puppeteer) });

// app.listen(port, fn)
// fn will run right after listening to a port
const port = process.env.PORT || 3001;

// const DATABASE_URL = process.env.DATABASE_URL
app.listen(port, () => {
    printDateTime();
    console.log(`\nNode app is up & running on port: ${port}\n`);
})
