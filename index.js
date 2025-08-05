const express = require("express");
const axios = require("axios");
const cheerio = require("cheerio");
const cors = require("cors");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());

// مسار رئيسي للتحقق من أن الخادم يعمل
app.get("/", (req, res) => {
    res.json({ status: "API is running", endpoint: "/matches" });
});

// مسار جلب المباريات
app.get("/matches", async (req, res) => {
    try {
        const url = "https://jdwel.com/today/";
        const { data } = await axios.get(url);
        const $ = cheerio.load(data);

        let matches = [];

        $(".matches .match").each((_, element) => {
            const homeTeam = $(element).find(".team.hometeam .the_team").text().trim();
            const homeLogo = $(element).find(".team.hometeam img").attr("src");

            const awayTeam = $(element).find(".team.awayteam .the_team").text().trim();
            const awayLogo = $(element).find(".team.awayteam img").attr("src");

            const homeScore = $(element).find(".match_score .hometeam").text().trim() || "0";
            const awayScore = $(element).find(".match_score .awayteam").text().trim() || "0";

            const timeHidden = $(element).find(".the_otime").text().trim();
            const time = $(element).find(".the_time").text().trim();

            matches.push({
                home: {
                    name: homeTeam,
                    logo: homeLogo,
                    score: homeScore
                },
                away: {
                    name: awayTeam,
                    logo: awayLogo,
                    score: awayScore
                },
                timeHidden,
                time
            });
        });

        res.json({ count: matches.length, matches });
    } catch (error) {
        console.error("Error fetching matches:", error.message);
        res.status(500).json({ error: "Failed to fetch matches" });
    }
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
