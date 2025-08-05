const express = require('express');
const axios = require('axios');
const cheerio = require('cheerio');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;
const puppeteer = require('puppeteer');

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
  let browser;
  try {
    browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    const page = await browser.newPage();
    
    // محاكاة متصفح حقيقي
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36');
    await page.setExtraHTTPHeaders({
      'Accept-Language': 'en-US,en;q=0.9',
    });

    await page.goto('https://jdwel.com/today/', {
      waitUntil: 'networkidle2',
      timeout: 30000
    });

    // انتظر حتى تظهر العناصر المطلوبة
    await page.waitForSelector('.match_row', { timeout: 5000 });

    const matches = await page.evaluate(() => {
      const items = [];
      document.querySelectorAll('.match_row').forEach(match => {
        items.push({
          league: match.querySelector('.league_name')?.innerText.trim() || '',
          homeTeam: match.querySelector('.hometeam .team_name')?.innerText.trim() || '',
          awayTeam: match.querySelector('.awayteam .team_name')?.innerText.trim() || '',
          score: match.querySelector('.match_score')?.innerText.trim() || '0 - 0',
          time: match.querySelector('.match_time')?.innerText.trim() || ''
        });
      });
      return items;
    });

    await browser.close();
    res.json(matches);
  } catch (err) {
    if (browser) await browser.close();
    console.error('Puppeteer error:', err);
    res.status(500).json({
      error: 'Failed to fetch matches',
      details: err.message,
      solution: 'Try again later or contact support'
    });
  }
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
