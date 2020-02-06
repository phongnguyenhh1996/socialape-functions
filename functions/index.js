const functions = require('firebase-functions');

const express = require('express');
const app = express();
const FBAuth = require('./utils/fbAuth');
const { getAllScream, postOneScream, getScream, commentOnScream } = require('./handlers/scream.js');
const { signup, login, uploadImage, addUserDetails, getMe } = require('./handlers/user');

// scream route
app.get('/scream', getAllScream);
app.post('/scream', FBAuth, postOneScream);
app.get('/scream/:screamId', getScream);
app.post('/scream/:screamId/comment', FBAuth, commentOnScream);
// TODO: delete scream
// TODO: like a scream with
// TODO: unlike a scream
// user route
app.post('/signup', signup);
app.post('/login', login);
app.post('/user', FBAuth, addUserDetails);
app.get('/user', FBAuth, getMe);
app.post('/user/image', FBAuth, uploadImage);

exports.api = functions.https.onRequest(app);