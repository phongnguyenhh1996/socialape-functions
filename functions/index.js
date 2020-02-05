const functions = require('firebase-functions');

const express = require('express');
const app = express();
const FBAuth = require('./utils/fbAuth');
const { getAllScream, postOneScream } = require('./handlers/scream.js');
const { signup, login, uploadImage } = require('./handlers/user');

// scream route
app.get('/scream', getAllScream);
app.post('/scream', FBAuth, postOneScream);
// user route
app.post('/signup', signup);
app.post('/login', login);
app.post('/user/image', FBAuth, uploadImage);

exports.api = functions.https.onRequest(app);