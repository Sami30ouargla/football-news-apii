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
    endpoints: ["/news", "/news/espn", "/news/goal", "/news/onefootball", "/news/90mins"]
  });
});

app.get('/news/espn', async (req, res) => {
  try {
    const { data } = await axios.get('https://www.espn.com/soccer/');
    const $ = cheerio.load(data);
    let news = [];
    $('section a').each((i, el) => {
      const title = $(el).text().trim();
      const link = $(el).attr('href');
      if (title && link && link.includes('/story/')) {
        news.push({
          title,
          link: link.startsWith('http') ? link : `https://www.espn.com${link}`
        });
      }
    });
    res.json(news);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch ESPN news' });
  }
});

app.get('/news/goal', async (req, res) => {
  try {
    const { data } = await axios.get('https://www.goal.com/en');
    const $ = cheerio.load(data);
    let news = [];
    $('a[data-testid="card-headline"]').each((i, el) => {
      const title = $(el).text().trim();
      const link = $(el).attr('href');
      if (title && link) {
        news.push({
          title,
          link: link.startsWith('http') ? link : `https://www.goal.com${link}`
        });
      }
    });
    res.json(news);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch Goal.com news' });
  }
});

app.get('/news/onefootball', async (req, res) => {
  try {
    const { data } = await axios.get('https://onefootball.com/en/home');
    const $ = cheerio.load(data);
    let news = [];
    $('a').each((i, el) => {
      const title = $(el).text().trim();
      const link = $(el).attr('href');
      if (title && link && link.includes('/news/')) {
        news.push({
          title,
          link: link.startsWith('http') ? link : `https://onefootball.com${link}`
        });
      }
    });
    res.json(news);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch OneFootball news' });
  }
});

app.get('/news/90mins', async (req, res) => {
  try {
    const { data } = await axios.get('https://www.90min.com/');
    const $ = cheerio.load(data);
    let news = [];
    $('a').each((i, el) => {
      const title = $(el).text().trim();
      const link = $(el).attr('href');
      if (title && link && link.includes('/posts/')) {
        news.push({
          title,
          link: link.startsWith('http') ? link : `https://www.90min.com${link}`
        });
      }
    });
    res.json(news);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch 90mins news' });
  }
});

app.get('/news', async (req, res) => {
  res.json({
    message: "Use one of the following endpoints for specific news sources:",
    sources: ["/news/espn", "/news/goal", "/news/onefootball", "/news/90mins"]
  });
});

app.listen(PORT, () => {
  console.log(`✅ Football News API running on port ${PORT}`);
});
