const rootDir = require('../../util/path');
require('dotenv').config({ path: `${rootDir}/controllers/.env`});
const { printDateTime } = require('../../util/printDateTime');

const { validationResult } = require('express-validator');
const HttpError = require('../../models/http-error');

const db = require('../../util/database');
const bcrypt = require('bcrypt-nodejs');

const isProduction = process.env.NODE_ENV === 'production';

// create http://localhost:3001/signin route
exports.handleSignin = (req, res, next) => {
    printDateTime();

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return next(
            new HttpError('Invalid inputs passed, please check your data.', 422)
        );
    }
    
    const { email, password } = req.body;
    
    const callbackName = `handleSignin`;
    console.log(`\nJust received an HTTP request for:\n${callbackName}\n`);

    // Server-side validations
    // If there're no req.body.email OR req.body.password
    if (!email || !password) {
        return res.status(422).json({
            sucess: false,
            status: { code: 422 },
            message: `Email & password must be provided!`
        })
    }

    db('users')
    .select('email', 'hash')
    .where('email', '=', email)
    .from('login')
    .then((response) => {

        // Comparing users' password input from req.body.password
        // to server-side fetched json
        const isValid = bcrypt.compareSync(password, response[0].hash);
        if (!isValid) {
            return res.status(401).json({
                success: false,
                status: { code: 401 },
                message: `Authentication failed!`
            })
        }

        // If they match up
        // return SELECT * FROM users WHERE email = req.body.email;
        // Will give a user json object
        db.select('*').from('users').where('email', '=', email)
        .then((users) => {
            if (users.length === 0) {
                throw new HttpError('User not found', 404);
            }

            const userData = users[0];
            // Store user info in session => return res.status(200).json(user[0]);
            req.session.user = userData; 

            return res.status(200).cookie('userData', JSON.stringify({
                id: userData.id,
                email: userData.email
            }), {
                   maxAge: 900000, // 15 min
                    httpOnly: isProduction,
                    // httpOnly: false, // Now accessible to React frontend
                    secure: isProduction,
                    sameSite: 'None' // Necessary for cross-origin/cross-site requests
                }).json(userData);
        })
        .catch((err) => {
            if (err instanceof HttpError) {
                return res.status(401).json({
                    success: false,
                    status: { code: 401 },
                    message: `Error during Login: ${err.message}`
                });
            } else {
                console.error(`Error during sign in: ${err}`);
                return res.status(500).json({
                    success: false,
                    status: { code: 500 },
                    message: `Server Internal Error during Login`
                })
            }
        });
    })
    .catch((err) => {
        if (err instanceof HttpError) {
            console.error(`\nError during Login:\n`, err, `\n`);

            return res.status(401).json({
                success: false,
                status: { code: 401 },
                message: `Error during Login`
            });
        } else {
            console.error(`Error during sign in:\n`, err, `\n`);

            return res.status(500).json({
                success: false,
                status: { code: 500 },
                message: `Server Internal Error during Login: ${err.message}`
            })
        }
    });
};
