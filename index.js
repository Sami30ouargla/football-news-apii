const express = require("express");
const axios = require("axios");
const cheerio = require("cheerio");
const cors = require("cors");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());

app.get("/", (req, res) => {
    res.json({ status: "API is running", endpoint: "/matches" });
});

app.get("/matches", async (req, res) => {
    try {
        const url = "https://jdwel.com/today/";
        const { data } = await axios.get(url, {
            headers: {
                "User-Agent":
                    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
                "Accept-Language": "ar,en;q=0.9"
            },
            timeout: 15000
        });

        const $ = cheerio.load(data);
        let matches = [];

        $(".matches .match").each((_, element) => {
            const homeTeam = $(element).find(".team.hometeam .the_team").text().trim();
            let homeLogo = $(element).find(".team.hometeam img").attr("src");
            if (homeLogo && !homeLogo.startsWith("http")) {
                homeLogo = "https://jdwel.com" + homeLogo;
            }

            const awayTeam = $(element).find(".team.awayteam .the_team").text().trim();
            let awayLogo = $(element).find(".team.awayteam img").attr("src");
            if (awayLogo && !awayLogo.startsWith("http")) {
                awayLogo = "https://jdwel.com" + awayLogo;
            }

            const homeScore = $(element).find(".match_score .hometeam").text().trim() || "0";
            const awayScore = $(element).find(".match_score .awayteam").text().trim() || "0";

            const timeHidden = $(element).find(".the_otime").text().trim();
            const time = $(element).find(".the_time").text().trim();

            if (homeTeam && awayTeam) {
                matches.push({
                    home: { name: homeTeam, logo: homeLogo, score: homeScore },
                    away: { name: awayTeam, logo: awayLogo, score: awayScore },
                    timeHidden,
                    time
                });
            }
        });

        res.json({ count: matches.length, matches });
    } catch (error) {
        console.error("Error fetching matches:", error.message);
        res.status(500).json({ error: "Failed to fetch matches" });
    }
});

app.listen(PORT, () => {
    console.log(`✅ Server running on port ${PORT}`);
});
