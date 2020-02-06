const functions = require('firebase-functions');

const express = require('express');
const app = express();
const FBAuth = require('./utils/fbAuth');
const { getAllScream, postOneScream, getScream, commentOnScream, likeScream, unlikeScream, deleteScream } = require('./handlers/scream.js');
const { signup, login, uploadImage, addUserDetails, getMe } = require('./handlers/user');

// scream route
app.get('/scream', getAllScream);
app.post('/scream', FBAuth, postOneScream);
app.get('/scream/:screamId', getScream);
app.post('/scream/:screamId/comment', FBAuth, commentOnScream);
app.delete('/scream/:screamId', FBAuth, deleteScream);
app.get('/scream/:screamId/like', FBAuth, likeScream);
app.get('/scream/:screamId/unlike', FBAuth, unlikeScream);
// user route
app.post('/signup', signup);
app.post('/login', login);
app.post('/user', FBAuth, addUserDetails);
app.get('/user', FBAuth, getMe);
app.post('/user/image', FBAuth, uploadImage);

exports.api = functions.https.onRequest(app);