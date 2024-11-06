const express = require('express');
const { check } = require('express-validator');

/* Import our records controllers */
const profileController = require('../controllers/profile');

/* Calling Router from express.Router() method
router is a pluggable mini-Express app */
const router = express.Router();

/* Adding a Filter '/records' before all Express routes below
in rootDir/server.js */

/* Registering http://localhost:3001/profile/:id
=> Express Router POST request handler */
router.post( // const { id } = req.body;
    '/profile/:id', 
    [
        check('id').not().isEmpty().withMessage(`Id is required`)
        .isInt({ max: 500 }).withMessage(`ID must be <= 500`)
    ], 
    profileController.handleProfileGet
);

module.exports = router;