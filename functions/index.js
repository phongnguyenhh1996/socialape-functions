const functions = require('firebase-functions');

const express = require('express');
const app = express();
const FBAuth = require('./utils/fbAuth');
const { db } = require('./utils/admin');
const {
  getAllScream,
  postOneScream,
  getScream,
  commentOnScream,
  likeScream,
  unlikeScream,
  deleteScream
} = require('./handlers/scream.js');
const {
  signup,
  login,
  uploadImage,
  addUserDetails,
  getMe
} = require('./handlers/user');

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

exports.createNotificationOnLike = functions.firestore.document('likes/{id}')
  .onCreate((snapshot) => {
    db.doc(`/screams/${snapshot.data().screamId}`).get()
      .then((data) => {
        if (data.exists) {
          return db.doc(`/notifications/${snapshot.id}`).set({
            createdAt: new Date().toISOString(),
            recipient: data.data().userHandle,
            sender: snapshot.data().userHanle,
            type: 'like',
            read: false,
            screamId: data.id
          })
        }
      })
      .then(() => {
        return;
      })
      .catch((err) => {
        console.error(err);
        return;
      })
  });

exports.deleteNotificationOnUnlike = functions.firestore.document('likes/{id}')
  .onDelete(snapshot => {
    db.doc(`/notifications/${snapshot.id}`)
      .delete()
      .then(() => {
        return;
      })
      .catch((err) => {
        console.error(err);
        return;
      })
  })

exports.createNotificationOnComment = functions.firestore.document('comments/{id}')
.onCreate((snapshot) => {
  db.doc(`/screams/${snapshot.data().screamId}`).get()
    .then((data) => {
      if (data.exists) {
        return db.doc(`/notifications/${snapshot.id}`).set({
          createdAt: new Date().toISOString(),
          recipient: data.data().userHandle,
          sender: snapshot.data().userHanle,
          type: 'comment',
          read: false,
          screamId: data.id
        })
      }
    })
    .then(() => {
      return;
    })
    .catch((err) => {
      console.error(err);
      return;
    })
});