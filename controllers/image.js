const rootDir = require('../util/path');
require('dotenv').config({ path: `${rootDir}/controllers/.env`});

const db = require('../util/database');
const fetch = require('node-fetch');

const { validationResult } = require('express-validator');
const HttpError = require('../models/http-error');

const { printDateTime } = require('../util/printDateTime');
const { returnClarifaiRequestOptions } = require('../util/returnClarifaiRequestOptions');

// console.log(returnClarifaiRequestOptions("https://upload.wikimedia.org/wikipedia/commons/4/4d/Beautiful_landscape.JPG"));

/* http://localhost:3001/image */
exports.handleCelebrityApi = (req, res, next) => {
    printDateTime();

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return next(
            new HttpError('Invalid inputs passed, please check your data.', 422)
        );
    }

    const input = req.body.input;
    
    const requestHandlerName = `rootDir/controllers/image.js`;

    if (!input || typeof input !== 'string') {
      return res.status(422).json({
        success: false,
        status: { code: 422 },
        message: `${requestHandlerName} Undefined Input: ${input}`
      });
    }

    console.log(`req.body.input:\n${input}\ntypeof req.body.input:\n${typeof input}`);

    const API_BASE_URL = 'https://api.clarifai.com/v2/models/' +
          'celebrity-face-detection' +
          '/outputs';

    fetch(
        API_BASE_URL,
        returnClarifaiRequestOptions(input)
      )
      .then(response => {
        if (!response?.ok) {
          console.error(`\nFetched API\nYet failed to retrieve data...\n`);
          throw new Error(`Failed to fetch from API, status: ${response.status}`);
        }
        return response.json();
      })
      .then(data => {
        if (!data) {
          throw new Error(`\nNo data returned by fetching ${API_BASE_URL}\n`);
        }
        res.status(200).json(data);
      })
      .catch(err => {
        console.error(`\nError during fetch operation: ${err}\n`);
        res.status(502).json({ error: `Unable to fetch API...`, details: err.toString() });
      });
};

exports.handleColorApi = (req, res, next) => {
    printDateTime();

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return next(
            new HttpError('Invalid inputs passed, please check your data.', 422)
        );
    }

    const input = req.body.input;

    const requestHandlerName = `handleColorApi`;

    if (!input || typeof input !== 'string') {
      return res.status(400).json({
        success: false,
        status: { code: 400 },
        message: `${requestHandlerName} Invalid input: ${input}`
      });
    }

    console.log(`\nreq.body.input:\n${input}\ntypeof input:\n${typeof input}\n`);
    const API_BASE_URL = 'https://api.clarifai.com/v2/models/' +
          'color-recognition' +
          '/outputs';

    // fetch
    fetch(
        API_BASE_URL,
        returnClarifaiRequestOptions(input)
      )
      .then(response => {
        if (!response?.ok) {
          console.error(`\nFetched API\nYet failed to retrieve data...\n`);
          throw new Error(`Failed to fetch from API, status: ${response.status}`);
        }
        return response.json();
      })
      .then(data => {
        if (!data) {
          throw new Error(`\nNo data returned by fetching ${API_BASE_URL}\n`);
        }
        res.status(200).json(data);
      })
      .catch(err => {
        res.status(502).json({ error: `Unable to fetch API...`, details: err.toString() });
      });
};

exports.handleAgeApi = (req, res, next) => {
    printDateTime();

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return next(
            new HttpError('Invalid inputs passed, please check your data.', 422)
        );
    }

    const input = req.body.input;

    const requestHandlerName = `handleAgeApi`;

    if (!input || typeof input !== 'string') {
      return res.status(400).json({
        success: false,
        status: { code: 400 },
        message: `${requestHandlerName} Invalid input: ${input}`
      });
    }

    console.log(`req.body.input:\n${input}\ntypeof req.body.input:\n${typeof input}`);
    const API_BASE_URL = 'https://api.clarifai.com/v2/models/' +
          'age-demographics-recognition' +
          '/outputs';

    // fetch
    fetch(
        API_BASE_URL,
        returnClarifaiRequestOptions(input)
      )
      .then(response => {
        if (!response?.ok) {
          console.error(`\nFetched API\nYet failed to retrieve data...\n`);
          throw new Error(`Failed to fetch from API, status: ${response.status}`);
        }
        return response.json();
      })
      .then(data => {
        if (!data) {
          throw new Error(`\nNo data returned by fetching ${API_BASE_URL}\n`);
        }
        res.status(200).json(data);
      })
      .catch(err => {
        return res.status(502).json({ 
          error: `Unable to fetch API...`, 
          details: err.toString() 
        });
      });
};

exports.handleImage = (req, res, next) => {
  printDateTime();
  const requestHandlerName = `handleImage`;
  console.log(`\nJust received an Image\nrequestHandlerName:\n${requestHandlerName}`);

  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return next(
      new HttpError('Invalid inputs passed, please check your data.', 422)
    );
  }

  const { id } = req.body;

  if (!id || typeof id !== 'number') {
    return res.status(400).json({
      success: false,
      status: { code: 400 },
      message: `${requestHandlerName} Invalid id: ${id}`
    });
  }
  
  // To store entries increase to DB
  db('users')
  .where('id', '=', id)
  .increment('entries', 1)
  .returning('entries')
  .then((entries) => {
      console.log(`\nentries stored to DB\n`);
      console.log(entries, `\n`);

      // return updated entries for frontend
      return res.status(200).json({ 
        success: true, 
        status: { code: 200 }, 
        entries: entries,
        message: `Updated entries`
      });
  })
  .catch((err) => {
    return res.status(400).json({
    success: false,
    status: { code: 400 },
    error: `Unable to update entries\n${err}`
    })
    }
  );
};


