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