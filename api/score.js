const { startBrowser } = require("../lib/puppeteer");
const UserAgent = require("user-agents");
const { bodyJSON } = require("../utils");
const { JSDOM } = require("jsdom");

const infoGame = (DOM, className) => {
  const infoTeam = [...DOM.querySelectorAll(`table>tbody>${className}>td`)];
  const infoTxt = infoTeam[0].innerHTML;
  const el = new JSDOM(infoTxt).window.document;
  const a = el.querySelector("a");
  const codTeam = a.getAttribute("href").split("/")[2];
  const nameTeam = a.textContent;
  const score = infoTeam[1].innerHTML;
  return {
    codTeam,
    nameTeam,
    score,
  };
};

async function __getScores(body) {
  const { month, day, year } = body;
  const browser = await startBrowser();
  const page = await browser.newPage();
  const userAgent = new UserAgent();
  await page.setUserAgent(userAgent.toString());
  await page.setViewport({
    width: 1920,
    height: 1080,
  });
  const url = `https://www.basketball-reference.com/boxscores/?month=${month}&day=${day}&year=${year}`;
  await page.goto(url);
  const elements = await page.$$eval(
    "#content .game_summaries .game_summary",
    (el) => el.map((item) => item.outerHTML)
  );

  const arr = elements.map((el) => {
    const DOM = new JSDOM(el).window.document;
    const teamWinner = infoGame(DOM, "tr.winner");
    const teamLoser = infoGame(DOM, "tr.loser");
    return { teamWinner, teamLoser };
  });

  browser.close();
  return arr;
}

module.exports = async (req, res) => {
  try {
    const scores = await __getScores(bodyJSON(req.body));
    res.status(200).json({ response: scores });
  } catch (err) {
    console.log(err);
    res.status(500).json({ err });
  }
};
