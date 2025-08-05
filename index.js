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
    const { data } = await axios.get('https://jdwel.com/today/', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    });
    
    const $ = cheerio.load(data);
    let matches = [];

    // البحث عن عناصر المباريات
    $('.match').each((i, el) => {
      const matchElement = $(el);
      
      // استخراج بيانات الفريق المضيف
      const homeTeamElement = matchElement.find('.team.hometeam');
      const homeTeam = homeTeamElement.find('.the_team').first().text().trim();
      const homeTeamLogo = homeTeamElement.find('img.team_logo').attr('src');
      
      // استخراج بيانات الفريق الضيف
      const awayTeamElement = matchElement.find('.team.awayteam');
      const awayTeam = awayTeamElement.find('.the_team').first().text().trim();
      const awayTeamLogo = awayTeamElement.find('img.team_logo').attr('src');
      
      // استخراج النتيجة
      const scoreElement = matchElement.find('.match_score');
      const homeScore = scoreElement.find('.hometeam').text().trim();
      const awayScore = scoreElement.find('.awayteam').text().trim();
      
      // استخراج الوقت والتاريخ
      const matchTime = matchElement.find('.the_time').text().trim();
      const fullDate = matchElement.find('.the_otime').text().trim();
      
      // استخراج رابط المباراة
      const matchLink = matchElement.find('a').attr('href');
      
      // استخراج اسم البطولة
      const league = matchElement.find('.league_name').text().trim();
      
      matches.push({
        league,
        homeTeam,
        homeTeamLogo: homeTeamLogo ? `https://jdwel.com${homeTeamLogo}` : null,
        awayTeam,
        awayTeamLogo: awayTeamLogo ? `https://jdwel.com${awayTeamLogo}` : null,
        score: `${homeScore} - ${awayScore}`,
        homeScore,
        awayScore,
        matchTime,
        fullDate,
        matchLink: matchLink ? `https://jdwel.com${matchLink}` : null
      });
    });

    if (matches.length === 0) {
      return res.status(404).json({ error: 'No matches found', html: data });
    }

    res.json(matches);
  } catch (err) {
    console.error('Error details:', err.message);
    res.status(500).json({ 
      error: 'Failed to fetch matches data',
      details: err.message
    });
  }
});

app.listen(PORT, () => {
  console.log(`✅ Football News API running on port ${PORT}`);
});
