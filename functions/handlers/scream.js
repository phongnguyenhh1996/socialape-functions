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
    userImage: req.user.imageUrl,
    createdAt: new Date().toISOString(),
    likeCount: 0,
    commentCount: 0
  };
  db
    .collection('screams')
    .add(newScream)
    .then((doc) => {
      const resScream = newScream;
      resScream.screamId = doc.id;
      return res.json(resScream);
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
      return doc.ref.update({ commentCount: doc.data().commentCount + 1 })
    })
    .then(() => {
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

exports.likeScream = (req, res) => {
  const likeDocument = db.collection('likes').where('userHandle', '==', req.user.handle)
    .where('screamId', '==', req.params.screamId).limit(1);
  const screamDocument = db.doc(`/screams/${req.params.screamId}`);
  let screamData;
  screamDocument.get()
    .then(doc => {
      if (doc.exists) {
        screamData = doc.data();
        screamData.screamId = doc.id;
        return likeDocument.get();
      } else {
        return res.status(404).json({ error: 'Scream not found' });
      }
    })
    .then(doc => {
      if (doc.empty) {
        return db.collection('likes').add({
          screamId: req.params.screamId,
          userHandle: req.user.handle
        })
        .then(() => {
          screamData.likeCount++;
          return screamDocument.update({ likeCount: screamData.likeCount })
        })
        .then(() => {
          return res.json(screamData);
        })
      } else {
        return res.status(400).json({ error: 'Scream already liked' });
      }
    })
    .catch((err) => {
      console.error(err);
      return res.status(500).json(error);
    })
}

exports.unlikeScream = (req, res) => {
  const likeDocument = db.collection('likes').where('userHandle', '==', req.user.handle)
    .where('screamId', '==', req.params.screamId).limit(1);
  const screamDocument = db.doc(`/screams/${req.params.screamId}`);
  let screamData;
  screamDocument.get()
    .then(doc => {
      if (doc.exists) {
        screamData = doc.data();
        screamData.screamId = doc.id;
        return likeDocument.get();
      } else {
        return res.status(404).json({ error: 'Scream not found' });
      }
    })
    .then(doc => {
      if (doc.empty) {
        return res.status(400).json({ error: 'Scream already unliked' });
      } else {
        return db.doc(`/likes/${doc.docs[0].id}`).delete()
          .then(() => {
            screamData.likeCount--;
            return screamDocument.update({ likeCount: screamData.likeCount});
          })
          .then(() => {
            res.json(screamData);
          })
      }
    })
    .catch((err) => {
      console.error(err);
      return res.status(500).json(error);
    })
}

exports.deleteScream = (req, res) => {
  const document = db.doc(`/screams/${req.params.screamId}`);
  document.get()
    .then((doc) => {
      if (!doc.exists) {
        return res.status(404).json({ error: 'Scream not found'});
      }
      if (doc.data().handle !== req.user.handle) {
        return res.status(403).json({ error: 'Unauthorized'});
      } else {
        return document.delete();
      }
    })
    .then(() => {
      res.json({ message: 'Scream deleted' });
    })
    .catch((err) => {
      console.error(err);
      return res.status(500).json(err);
    })
}