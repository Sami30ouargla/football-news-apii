const express = require('express');
const cors = require('cors');
const fs = require('fs-extra');
const { Cluster } = require('puppeteer-cluster');

const app = express();
const PORT = process.env.PORT || 3000;
const CACHE_FILE = './cache/news.json';

// وظيفة لجلب تفاصيل المقال
async function scrapeArticle({ page, data: link }) {
  await page.goto(link, { waitUntil: 'networkidle2', timeout: 0 });
  return await page.evaluate(() => {
    const title = document.querySelector('meta[property="og:title"]')?.content ||
                  document.querySelector('h1')?.innerText || null;
    const image = document.querySelector('meta[property="og:image"]')?.content ||
                  document.querySelector('img')?.src || null;
    const video = document.querySelector('meta[property="og:video"]')?.content ||
                  document.querySelector('video source')?.src || null;
    const published = document.querySelector('meta[property="article:published_time"]')?.content ||
                      document.querySelector('time')?.getAttribute('datetime') || null;
    let content = '';
    document.querySelectorAll('p').forEach(p => content += p.innerText + '\n');
    return { title, image, content, video, published };
  });
}

// وظيفة لجلب روابط ESPN
async function scrapeEspnLinks({ page }) {
  await page.goto('https://www.espn.com/soccer/', { waitUntil: 'networkidle2', timeout: 0 });
  const links = await page.$$eval('section a[href*="/story/"]', els => els.map(a => a.href));
  return links.slice(0, 5);
}

// وظيفة لجلب روابط Goal
async function scrapeGoalLinks({ page }) {
  await page.goto('https://www.goal.com/en/news', { waitUntil: 'networkidle2', timeout: 0 });
  const links = await page.$$eval('a[href*="/en/news/"]', els => els.map(a => a.href));
  return [...new Set(links)].slice(0, 5);
}

// وظيفة لجلب روابط OneFootball
async function scrapeOneFootballLinks({ page }) {
  await page.goto('https://onefootball.com/en/home', { waitUntil: 'networkidle2', timeout: 0 });
  const links = await page.$$eval('a[href*="/en/news/"]', els => els.map(a => a.href));
  return [...new Set(links)].slice(0, 5);
}

// وظيفة لجلب روابط 90mins
async function scrape90minsLinks({ page }) {
  await page.goto('https://www.90min.com/', { waitUntil: 'networkidle2', timeout: 0 });
  const links = await page.$$eval('a[href*="/posts/"]', els => els.map(a => a.href));
  return [...new Set(links)].slice(0, 5);
}

// وظيفة لتحديث الأخبار وحفظها في cache
async function updateNewsCache() {
  console.log('🔄 Updating news cache...');
  const cluster = await Cluster.launch({
    concurrency: Cluster.CONCURRENCY_CONTEXT,
    maxConcurrency: 3,
    puppeteerOptions: { args: ['--no-sandbox', '--disable-setuid-sandbox'] }
  });

  const results = [];

  const espnLinks = await cluster.execute({}, scrapeEspnLinks);
  for (const link of espnLinks) {
    const data = await cluster.execute(link, scrapeArticle);
    results.push({ ...data, link, source: 'ESPN' });
  }

  const goalLinks = await cluster.execute({}, scrapeGoalLinks);
  for (const link of goalLinks) {
    const data = await cluster.execute(link, scrapeArticle);
    results.push({ ...data, link, source: 'Goal' });
  }

  const oneLinks = await cluster.execute({}, scrapeOneFootballLinks);
  for (const link of oneLinks) {
    const data = await cluster.execute(link, scrapeArticle);
    results.push({ ...data, link, source: 'OneFootball' });
  }

  const min90Links = await cluster.execute({}, scrape90minsLinks);
  for (const link of min90Links) {
    const data = await cluster.execute(link, scrapeArticle);
    results.push({ ...data, link, source: '90mins' });
  }

  await cluster.idle();
  await cluster.close();

  await fs.ensureDir('./cache');
  await fs.writeJson(CACHE_FILE, results, { spaces: 2 });
  console.log('✅ News cache updated.');
}

app.get('/news', async (req, res) => {
  try {
    if (!fs.existsSync(CACHE_FILE)) {
      await updateNewsCache();
    }
    const data = await fs.readJson(CACHE_FILE);
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: 'Failed to load news' });
  }
});

app.get('/update', async (req, res) => {
  try {
    await updateNewsCache();
    res.json({ message: 'Cache updated successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update cache' });
  }
});

app.get('/', (req, res) => {
  res.json({
    message: "Football News API with multiple sources is running 🚀",
    endpoints: ["/news", "/update"]
  });
});

app.listen(PORT, () => {
  console.log(`✅ Football News API running on port ${PORT}`);
});
