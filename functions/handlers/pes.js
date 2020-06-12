const fetchData = require('../utils/fetchData')
const cheerio = require('cheerio');
const base = 'https://www.pesmaster.com';
const { admin, db } = require('../utils/admin');

function getTeams(leagues, index = 0, callBack) {
  if (leagues[index] && leagues[index].link) {
    console.log(leagues[index].link);
    let batch = db.batch();
    fetchData(leagues[index].link).then((teamPage) => {
      const $ = cheerio.load(teamPage.data);
      const statsTeam = $('.team-block');

      statsTeam.each(function() {
        let stat = $(this).find('.stat').text();
        let name = $(this).find('.team-block-name').text();
        let logo = $(this).find('.team-block-logo').attr('src');
        let link = $(this).find('a').attr('href');
        let code = link.split('/')[1];
        let team = {
          stat,
          name,
          logo: base + logo,
          link: base + link,
          code,
          leagueCode: leagues[index].code
        }
        let docRef = db.collection('teams').doc(team.code)
        batch.set(docRef, team)
      })
      batch.commit().then(() => getTeams(leagues, index + 1, callBack))
    })
  } else {
    return callBack()
  }
}

async function getPlayers(team) {
  let batch = db.batch();
  let teamPage = await fetchData(team.link)
  const $ = cheerio.load(teamPage.data);
  const players = $('#search-result-table tbody tr');
  const statsBlocks = $('.stat-donut-block');
  const stats = {
    attack: statsBlocks.eq(3).find('.stat').text(),
    defence: statsBlocks.eq(1).find('.stat').text(),
    midfield: statsBlocks.eq(2).find('.stat').text(),
  }
  console.log(team.link);
  let docRef = db.collection('teams').doc(team.code)
  batch.update(docRef, {stats})
  players.each(function() {
    let stats = $(this).find('.squad-table-stat')
    let stat = {
      ovr: stats.eq(0).text(),
      pas: stats.eq(1).text(),
      sht: stats.eq(2).text(),
      str: stats.eq(3).text(),
      def: stats.eq(4).text(),
      spd: stats.eq(5).text(),
      dri: stats.eq(6).text()
    }
    let name = $(this).find('.namelink').text();
    let logo = $(this).find('.player_head').attr('src');
    let link = $(this).find('.namelink').attr('href');
    let country = $(this).find('.country-flag').attr('src');
    let age = $(this).find('.squad-table-age').text();
    let height = $(this).find('.squad-table-height').text();
    let position = $(this).find('.squad-table-pos').text()
    let code = link.split('/')[1];
    let id = link.split('/')[4];
    let player = {
      stats: stat,
      name,
      logo: base + logo,
      link: base + link,
      country: base + country,
      age,
      height,
      position,
      code,
      team: team.code,
      id
    }
    let docRef = db.collection('players').doc(id)
    batch.set(docRef, player)
  })
  return batch.commit()
}

async function createPromises(teams) {
let promises = []
for(const team of teams) {
  let promise = await getPlayers(team);
  promises.push(promise);
}
return promises
};

async function crawPlayerOneByOne(promises) {
for(const promise of promises) {
  await promise();
}
};
exports.crawLeagues = (req, mainRes) => {
  const crawUrl = "https://www.pesmaster.com/pes-2020/#leagues";
  let leagues = []
  fetchData(crawUrl).then( (res) => {
      const html = res.data;
      const $ = cheerio.load(html);
      const statsTable = $('#leagues + .team-block-container .team-block');
      let batch = db.batch();
      statsTable.each(function() {
          let title = $(this).find('.team-block-name').text();
          let logo = $(this).find('.team-block-logo').attr('src');
          let link = $(this).find('a').attr('href');
          let code = link.split('/')[1];
          let league = {
            title,
            logo: base + logo,
            link: base + link,
            code
          }
          leagues.push(league);
          let docRef = db.collection('leagues').doc(code)
          batch.set(docRef, league)
      });
      
      return batch.commit()
  }).then(() => mainRes.status(200).json({leagues: leagues}))
}

exports.crawTeams = (req, res) => {
  db
    .collection('leagues')
    .get()
    .then((data) => {
      let leagues = [];
      data.forEach(doc => {
        leagues.push(doc.data());
      });
      return getTeams(leagues, 0, function() {
        return res.json({ success: true });
      })
    })
    .catch(err => console.log(err))
}

exports.crawPlayers = (req, res) => {
  db
    .collection('teams')
    .orderBy('code')
    .startAt('uruguay')
    .limit(200)
    .get()
    .then((data) => {
      let teams = [];
      data.forEach(doc => {
        teams.push(doc.data());
      });
      return createPromises(teams)
    })
    .then(promises => crawPlayerOneByOne(promises).then(() => res.json({ success: true })))
    .catch(err => console.log(err))
}

exports.getLeagues =(req, res) => {
  db
    .collection('leagues')
    .get()
    .then((data) => {
      let leagues = [];
      data.forEach(doc => {
        leagues.push(doc.data());
      });
      return res.json(leagues);
    })
    .catch(err => console.log(err))
}

exports.getTeams = (req, res) => {
  console.log(req.query.league);
  
  db
    .collection('teams')
    .where('leagueCode', '==', req.query.league)
    .get()
    .then((data) => {
      
      let teams = [];
      data.forEach(doc => {
        teams.push(doc.data());
      });
      return res.json(teams);
    })
    .catch(err => console.log(err))
}

exports.getPlayers = (req, res) => {
  console.log(req.query.team);
  
  db
    .collection('players')
    .where('team', '==', req.query.team)
    .get()
    .then((data) => {
      
      let players = [];
      data.forEach(doc => {
        players.push(doc.data());
      });
      return res.json(players);
    })
    .catch(err => console.log(err))
}