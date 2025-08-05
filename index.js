const express = require('express');
const axios = require('axios');
const cheerio = require('cheerio');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());

app.get('/', (req, res) => {
  res.json({
    message: "Football News API is running 🚀",
    endpoints: [
      "/news", 
      "/news/espn", 
      "/news/goal", 
      "/news/onefootball", 
      "/news/90mins",
      "/matches"
    ]
  });
});

// ... (بقية نقاط النهاية الحالية للإخباريات تبقى كما هي) ...

app.get('/matches', async (req, res) => {
  try {
    const { data } = await axios.get('https://jdwel.com/today/');
    const $ = cheerio.load(data);
    let matches = [];

    // البحث عن عناصر المباريات
    $('.match').each((i, el) => {
      const homeTeam = $(el).find('.hometeam .the_team').text().trim();
      const homeTeamLogo = $(el).find('.hometeam .team_logo').attr('src');
      const awayTeam = $(el).find('.awayteam .the_team').text().trim();
      const awayTeamLogo = $(el).find('.awayteam .team_logo').attr('src');
      const homeScore = $(el).find('.match_score .hometeam').text().trim();
      const awayScore = $(el).find('.match_score .awayteam').text().trim();
      const matchTime = $(el).find('.the_time').text().trim();
      const fullDate = $(el).find('.the_otime').text().trim();

      matches.push({
        homeTeam,
        homeTeamLogo: homeTeamLogo ? `https://jdwel.com${homeTeamLogo}` : null,
        awayTeam,
        awayTeamLogo: awayTeamLogo ? `https://jdwel.com${awayTeamLogo}` : null,
        score: `${homeScore} - ${awayScore}`,
        homeScore,
        awayScore,
        matchTime,
        fullDate,
        matchLink: `https://jdwel.com${$(el).find('a').attr('href')}` || null
      });
    });

    res.json(matches);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch matches data' });
  }
});

app.listen(PORT, () => {
  console.log(`✅ Football News API running on port ${PORT}`);
});
