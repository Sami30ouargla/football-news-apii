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
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
        'Referer': 'https://jdwel.com/',
        'DNT': '1',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1'
      },
      timeout: 10000
    });
    
    const $ = cheerio.load(data);
    let matches = [];

    // البحث عن عناصر المباريات - نسخة معدلة بناء على الهيكل الحالي للموقع
    $('.match_row').each((i, el) => {
      try {
        const matchElement = $(el);
        
        // استخراج البيانات مع معالجة أكثر قوة للأخطاء
        const homeTeam = matchElement.find('.hometeam .team_name').text().trim() || 
                        matchElement.find('.hometeam .the_team').text().trim();
        
        const homeTeamLogo = matchElement.find('.hometeam img.team_logo').attr('src') || 
                           matchElement.find('.hometeam img').attr('src');
        
        const awayTeam = matchElement.find('.awayteam .team_name').text().trim() || 
                        matchElement.find('.awayteam .the_team').text().trim();
        
        const awayTeamLogo = matchElement.find('.awayteam img.team_logo').attr('src') || 
                           matchElement.find('.awayteam img').attr('src');
        
        const scoreElement = matchElement.find('.match_score');
        const homeScore = scoreElement.find('.hometeam').text().trim() || '0';
        const awayScore = scoreElement.find('.awayteam').text().trim() || '0';
        
        const matchTime = matchElement.find('.match_time').text().trim() || 
                         matchElement.find('.the_time').text().trim();
        
        const fullDate = matchElement.find('.match_date').text().trim() || 
                        matchElement.find('.the_otime').text().trim();
        
        const league = matchElement.find('.league_name').text().trim() || 
                     matchElement.closest('.league_box').find('.league_header').text().trim();
        
        matches.push({
          league: league || 'Unknown League',
          homeTeam: homeTeam || 'Unknown Team',
          homeTeamLogo: homeTeamLogo ? `https://jdwel.com${homeTeamLogo.startsWith('/') ? '' : '/'}${homeTeamLogo}` : null,
          awayTeam: awayTeam || 'Unknown Team',
          awayTeamLogo: awayTeamLogo ? `https://jdwel.com${awayTeamLogo.startsWith('/') ? '' : '/'}${awayTeamLogo}` : null,
          score: `${homeScore} - ${awayScore}`,
          homeScore,
          awayScore,
          matchTime,
          fullDate,
          status: matchElement.find('.match_status').text().trim() || 'Scheduled'
        });
      } catch (err) {
        console.error(`Error processing match ${i}:`, err.message);
      }
    });

    if (matches.length === 0) {
      console.warn('No matches found in the HTML content');
      return res.status(404).json({ 
        warning: 'No matches found', 
        suggestion: 'The website structure might have changed' 
      });
    }

    res.json(matches);
  } catch (err) {
    console.error('Full error details:', {
      message: err.message,
      response: err.response?.status,
      headers: err.response?.headers,
      data: err.response?.data
    });
    
    res.status(500).json({ 
      error: 'Failed to fetch matches data',
      details: {
        status: err.response?.status || 'No response',
        message: err.message,
        suggestion: 'The website might be blocking our requests. Try again later or use a proxy.'
      }
    });
  }
});

app.listen(PORT, () => {
  console.log(`✅ Football News API running on port ${PORT}`);
});
