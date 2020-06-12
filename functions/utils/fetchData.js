const axios = require('axios');

module.exports = (url) =>{
  console.log("Crawling data...")
  // make http call to url
  return axios(url).catch((err) => console.log(err));
  
}