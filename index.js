import express from "express";
import axios from "axios";
import * as cheerio from "cheerio";

const app = express();

app.get("/matches", async (req, res) => {
  try {
    const { data } = await axios.get("https://www.kooora.com/", {
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