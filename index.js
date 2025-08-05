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
        const url = "https://www.yalla-shoot-365.com/";
        const { data } = await axios.get(url, {
            headers: {
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
                "Accept-Language": "ar,en;q=0.9"
            },
            timeout: 20000
        });

        const $ = cheerio.load(data);
        let matches = [];

        $("a.STING-WEB-Match-div-Here").each((_, element) => {
            const matchLink = $(element).attr("href") ? "https://www.yalla-shoot-365.com" + $(element).attr("href") : null;

            // الفريق الأول
            const homeTeam = $(element).find(".STING-WEB-Match-div-Right .STING-WEB-Match-div-Team-Name").text().trim();
            let homeLogo = $(element).find(".STING-WEB-Match-div-Right img").attr("src");
            if (homeLogo && !homeLogo.startsWith("http")) {
                homeLogo = "https://www.yalla-shoot-365.com" + homeLogo;
            }

            // الفريق الثاني
            const awayTeam = $(element).find(".STING-WEB-Match-div-Left .STING-WEB-Match-div-Team-Name").text().trim();
            let awayLogo = $(element).find(".STING-WEB-Match-div-Left img").attr("src");
            if (awayLogo && !awayLogo.startsWith("http")) {
                awayLogo = "https://www.yalla-shoot-365.com" + awayLogo;
            }

            // التوقيت
            const matchTime = $(element).find(".Match-div-Status").text().trim();
            const startDate = $(element).find(".STING-WEB-Time-Descending").attr("data-start");

            // النتيجة
            const score = $(element).find(".STING-WEB-Match-div-Goal").text().replace(/\s+/g, " ").trim() || "0 - 0";

            if (homeTeam && awayTeam) {
                matches.push({
                    link: matchLink,
                    home: { name: homeTeam, logo: homeLogo },
                    away: { name: awayTeam, logo: awayLogo },
                    time: matchTime,
                    start: startDate,
                    score: score
                });
            }
        });

        res.json({ count: matches.length, matches });
    } catch (error) {
        console.error("❌ Error fetching matches:", error.message);
        res.status(500).json({ error: "Failed to fetch matches" });
    }
});

app.listen(PORT, () => {
    console.log(`✅ Server running on port ${PORT}`);
});
