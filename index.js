import express from "express";
import axios from "axios";
import * as cheerio from "cheerio";

const app = express();

app.get("/matches", async (req, res) => {
  try {
    const { data } = await axios.get("https://www.kooora.com/%D9%83%D8%B1%D8%A9-%D8%A7%D9%84%D9%82%D8%AF%D9%85/%D9%85%D8%A8%D8%A7%D8%B1%D9%8A%D8%A7%D8%AA-%D8%A7%D9%84%D9%8A%D9%88%D9%85", {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36",
      },
    });

    const $ = cheerio.load(data);
    const matches = [];

    $('script[type="application/ld+json"]').each((i, el) => {
      try {
        const jsonText = $(el).html().trim();

        if (!jsonText) return;

        const jsonData = JSON.parse(jsonText);

        const events = Array.isArray(jsonData) ? jsonData : [jsonData];

        events.forEach((event) => {
          if (event["@type"] === "SportsEvent") {
            matches.push({
              name: event.name || "",
              startDate: event.startDate || "",
              location: event.location?.name || "",
              url: event.url || "",
              status: event.eventStatus || "",
              homeTeam: {
                name: event.homeTeam?.name || "",
                logo: event.homeTeam?.logo || "",
              },
              awayTeam: {
                name: event.awayTeam?.name || "",
                logo: event.awayTeam?.logo || "",
              },
            });
          }
        });
      } catch (err) {
        console.error("JSON parse error:", err.message);
      }
    });

    res.json({
      count: matches.length,
      matches,
    });
  } catch (error) {
    console.error("Error fetching matches:", error.message);
    res.status(500).json({ error: "Failed to fetch matches" });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
});
