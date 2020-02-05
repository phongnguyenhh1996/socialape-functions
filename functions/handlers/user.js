const { admin, db } = require('../utils/admin');
const firebase = require('firebase');
const configFirebase = require('../utils/configFirebase');
const { validateSignupData, validateLoginData } = require('../utils/validators');

firebase.initializeApp(configFirebase)

exports.signup = (req, res) => {
  const newUser = {
    email: req.body.email,
    password: req.body.password,
    confirmPassword: req.body.confirmPassword,
    handle: req.body.handle
  }
  const { errors, valid } = validateSignupData(newUser);
  if (!valid) {
    return res.status(400).json(errors);
  }
  let noImg = 'no-img.png'; 
  let idToken, userId;
  db.doc(`/users/${newUser.handle}`)
    .get()
    .then(user => {
      if (user.exists) {
        return res.status(400).json({
          handle: 'this handle is already taken'
        });
      } else {
        return firebase.auth().createUserWithEmailAndPassword(newUser.email, newUser.password)
      }
    })
    .then(user => {
      userId = user.user.uid;
      return user.user.getIdToken();
    })
    .then(token => {
      idToken = token;
      const userCredentials = {
        handle: newUser.handle,
        email: newUser.email,
        createdAt: new Date().toISOString(),
        imageUrl: `https://firebasestorage.googleapis.com/v0/b/${configFirebase.storageBucket}/o/${noImg}?alt=media`,
        userId
      }
      return db.doc(`/users/${userCredentials.handle}`).set(userCredentials);
    })
    .then(() => res.status(200).json({
      token: idToken
    }))
    .catch(error => {
      console.error(error);
      res.status(500).json(error);
    })
}

exports.login = (req, res) => {
  const user = {
    email: req.body.email,
    password: req.body.password
  }
  const { errors, valid } = validateLoginData(user);
  if (!valid) {
    return res.status(400).json(errors);
  }
  firebase.auth().signInWithEmailAndPassword(user.email, user.password)
    .then(data => data.user.getIdToken())
    .then(token => res.status(200).json({ token }))
    .catch(err => {
      console.error(err);
      return res.status(500).json(err);
    })
}

exports.uploadImage = (req, res) => {
  const Busboy = require('busboy');
  const path = require('path');
  const os = require('os');
  const fs = require('fs');

  const busboy = new Busboy({ headers: req.headers });
  let imageFilename;
  let imageToBeUploaded = {};
  busboy.on('file', (fieldname, file, filename, encoding, mimeType) => {
    if (mimeType !== 'image/png' && mimeType !== 'image/jpeg') {
      return res.status(400).json({ error: 'Wrong file type.' });
    }
    const fileExtension = filename.split('.')[filename.split('.').length - 1];
    imageFilename = `${Math.round(Math.random() * 1000000000000)}.${fileExtension}`;
    const filepath = path.join(os.tmpdir(), imageFilename);
    imageToBeUploaded = { filepath, mimeType };
    file.pipe(fs.createWriteStream(filepath));
  })
  busboy.on('finish', () => {
    admin.storage().bucket().upload(imageToBeUploaded.filepath, {
      resumable: false,
      metadata: {
        metadata: {
          contentType: imageToBeUploaded.mimeType
        }
      }
    })
    .then(() => {
      const imageUrl = `https://firebasestorage.googleapis.com/v0/b/${configFirebase.storageBucket}/o/${imageFilename}?alt=media`;
      return db.doc(`/users/${req.user.handle}`).update({ imageUrl });
    })
    .then(() => {
      return res.json({ message: 'Image uploaded successfully'});
    })
    .catch(err => {
      console.error(err);
      res.status(500).json(err);
    })
  })
  busboy.end(req.rawBody);
}