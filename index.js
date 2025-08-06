const express = require("express");
const axios = require("axios");
const cheerio = require("cheerio");
const app = express();

const PORT = process.env.PORT || 3000;
const BASE_URL = "https://www.kooora.com/كرة-القدم/مباريات-اليوم";

app.get("/matches", async (req, res) => {
    try {
        const response = await axios.get(BASE_URL);
        const $ = cheerio.load(response.data);

        let competitions = [];

        $(".match-list_match-list__0JCHF .fco-competition-section").each((i, elem) => {
            const leagueName = $(elem).find(".fco-competition-section__header-name").text().trim();
            const leagueCountry = $(elem).find(".fco-competition-section__header-area").text().trim();

            let matches = [];

            $(elem).find(".fco-match-row__container").each((j, matchElem) => {
                const matchTime = $(matchElem).find(".fco-match-start-date time").attr("datetime") || "";
                const matchUrl = BASE_URL + ($(matchElem).find("a.fco-match-start-date").attr("href") || "#");

                const homeTeam = $(matchElem).find(".fco-match-team-and-score__team-a .fco-team-name").first().text().trim();
                const homeLogo = $(matchElem).find(".fco-match-team-and-score__team-a img").attr("src") || "";

                const awayTeam = $(matchElem).find(".fco-match-team-and-score__team-b .fco-team-name").first().text().trim();
                const awayLogo = $(matchElem).find(".fco-match-team-and-score__team-b img").attr("src") || "";

                const scoreHome = $(matchElem).find(".fco-match-score[data-side='team-a']").text().trim() || "-";
                const scoreAway = $(matchElem).find(".fco-match-score[data-side='team-b']").text().trim() || "-";

                const channel = $(matchElem).find(".fco-match-row-tv-channel__header").text().replace("شاهد مباشرة على", "").trim() || "";
                const channelLogo = $(matchElem).find(".fco-match-row-tv-channel img").attr("src") || "";

                matches.push({
                    time: matchTime,
                    link: matchUrl,
                    home: { name: homeTeam, logo: homeLogo, score: scoreHome },
                    away: { name: awayTeam, logo: awayLogo, score: scoreAway },
                    channel: { name: channel, logo: channelLogo }
                });
            });

            if (matches.length > 0) {
                competitions.push({
                    league: leagueName,
                    country: leagueCountry,
                    matches: matches
                });
            }
        });

        res.json({ count: competitions.length, competitions });
    } catch (error) {
        console.error("خطأ أثناء جلب البيانات:", error.message);
        res.status(500).json({ error: "فشل في جلب المباريات" });
    }
});

app.listen(PORT, () => console.log(`✅ الخادم يعمل على المنفذ ${PORT}`));
