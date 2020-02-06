const { db } = require('../utils/admin.js');


exports.getAllScream = (req, res) => {
  db
    .collection('screams')
    .orderBy('createdAt', 'desc')
    .get()
    .then((data) => {
      let screams = [];
      data.forEach(doc => {
        screams.push({
          screamId: doc.id,
          body: doc.data().body,
          userHandle: doc.data().userHandle,
          createdAt: doc.data().createdAt,
          commentCount: doc.data().commentCount,
          likeCount: doc.data().likeCount
        });
      });
      return res.json(screams);
    })
    .catch(err => console.log(err))
}

exports.postOneScream = (req, res) => {
  const newScream = {
    body: req.body.body,
    handle: req.user.handle,
    createdAt: new Date().toISOString()
  };
  db
    .collection('screams')
    .add(newScream)
    .then(() => {
      res.json({
        message: 'Done'
      })
    })
    .catch(err => {
      res.status(500).json({
        error: 'something went wrong'
      });
      console.error(err);
    })
}

exports.getScream = (req, res) => {
  let screamData = {};
  db.doc(`/screams/${req.params.screamId}`).get()
    .then(data => {
      if (!data.exists) {
        return res.status(404).json({message: 'Scream not found'});
      }
      screamData = data.data();
      screamData.screamId = data.id;
      console.log(req.params.screamId);
      
      return db
        .collection('comments')
        .orderBy('createdAt', 'desc')
        .where('screamId', '==', req.params.screamId)
        .get()
    })
    .then(data => {
      screamData.comments = [];
      data.forEach(comment => {
        screamData.comments.push(comment.data());
      });
      return res.status(200).json(screamData);
    })
    .catch(err => {
      console.error(err);
      res.status(500).json(err);
    })
}

exports.commentOnScream = (req, res) => {
  if (req.body.body.trim() === '') {
    return res.status(400).json({ error: 'Must not be empty' });
  }
  const newComment = {
    body: req.body.body,
    createdAt: new Date().toISOString(),
    screamId: req.params.screamId,
    userHandle: req.user.handle,
    userImage: req.user.imageUrl
  }

  db.doc(`/screams/${req.params.screamId}`).get()
    .then(doc => {
      if (!doc.exists) {
        return res.status(404).json({error: 'Scream not found'});
      }
      return db.collection('comments').add(newComment);
    })
    .then(() => {
      return res.status(200).json(newComment)
    })
    .catch(err => {
      console.error(err);
      return res.status(500).json(err);
    })
}