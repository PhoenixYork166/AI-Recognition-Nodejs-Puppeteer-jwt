// const printDateTime = require('../util/printDateTime').printDateTime;
const { printDateTime } = require('../../util/printDateTime');
const rootDir = require('../../util/path');
require('dotenv').config({ path: `${rootDir}/.env`});

const { validationResult } = require('express-validator');
const HttpError = require('../../models/http-error');

const db = require('../../util/database');
const bcrypt = require('bcrypt-nodejs');

const isProduction = process.env.NODE_ENV = 'production';

// POST http://localhost:3001/register
exports.handleRegister = (req, res, next) => {
    printDateTime();

    const start = performance.now();

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(422).json({
            success: false,
            status: { code: 422 },
            message: `Invalid inputs passed, please check your data.`
        })
    }

    // Destructuring from req.body
    const { email, name, password } = req.body;   

    const callbackName = `handleRegister`;
    console.log(`\nJust received an HTTP request for:\n${callbackName}\n`);

    // If malicious users bypass frontend validation in <Register />
    // like using Postman
    if (!email || !name || !password ) {
        return res.status(422).json({
            success: false,
            status: { code: 422 },
            message: `Invalid inputs for register submission.`
        })
    }

    console.log(`\nreq.body.name: ${name}\nreq.body.email: ${email}\nreq.body.password: ${password}\n`);

    // Hashing users' entered passwords
    const bcryptHash = bcrypt.hashSync(password);

    db.transaction(trx => {
        trx.insert({
            name: name,
            email: email,
            joined: new Date().toISOString()
        })
        .into('users')
        .returning('email')
        .then((emailData) => {
            console.log(`\nemailData[0]:\n`, emailData[0], `\n`);
            
            const { email } = emailData[0];
            console.log(`\nemail:\n`, email, `\n`);

            return trx('login')
            .insert({
                hash: bcryptHash,
                email: email
            })
            .returning('*');
        })
        .then((loginData) => {
            const user = loginData[0];
            req.session.user = user;

            res.cookie('userData', JSON.stringify({
                id: user.id,
                email: user.email
            }), {
                maxAge: 900000,
                httpOnly: isProduction,
                secure: isProduction,
                sameSite: 'None'
            }).json(user);
        })
        .then(trx.commit)
        .catch(trx.rollback);
    })
    .catch((err) => {
        console.error(`\nError registering a new user:\n`, err, `\n`);
        console.error(err.message, `\n`);

        return res.status(400).json({
            success: false,
            status: { code: 400 },
            message: `Unable to register a new user`
        });
    });
};

