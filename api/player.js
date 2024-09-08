const { startBrowser } = require("../lib/puppeteer");
const UserAgent = require("user-agents");
const { bodyJSON } = require("../utils");
const { JSDOM } = require("jsdom");

function __getDataStat(el, stat) {
  return el.querySelector(`[data-stat="${stat}"]`)?.textContent;
}

function __getInfoSeason(el) {
  return {
    season: __getDataStat(el, "season"),
    age: __getDataStat(el, "age"),
    team_id: __getDataStat(el, "team_id"),
    pos: __getDataStat(el, "pos"),
    g: __getDataStat(el, "g"),
    mp_per_g: __getDataStat(el, "mp_per_g"),
    fga_per_g: __getDataStat(el, "fga_per_g"),
    drb_per_g: __getDataStat(el, "drb_per_g"),
    trb_per_g: __getDataStat(el, "trb_per_g"),
    ast_per_g: __getDataStat(el, "ast_per_g"),
    stl_per_g: __getDataStat(el, "stl_per_g"),
    blk_per_g: __getDataStat(el, "blk_per_g"),
  };
}

async function __infoPlayer(id) {
  const browser = await startBrowser();
  const page = await browser.newPage();
  const userAgent = new UserAgent();
  await page.setUserAgent(userAgent.toString());
  await page.setViewport({
    width: 1920,
    height: 1080,
  });
  const url = `https://basketball-reference.com/players/${id[0]}/${id}.html`;
  await page.goto(url);
  const elements = await page.$$eval("#per_game", (el) =>
    el.map((item) => item.outerHTML)
  );

  const arr = elements.map((el) => {
    const DOM = new JSDOM(`${el}`);
    const columns = [...DOM.window.document.querySelectorAll("tbody>tr")];
    const data = columns.map((el) => __getInfoSeason(el));
    return data;
  });
  browser.close();
  return arr;
}

module.exports = async (req, res) => {
  try {
    if (req.method === "GET") {
      const info = await __infoPlayer(req.query.cod);
      res.status(200).json({ response: info });
    }
  } catch (err) {
    console.log(err);
    res.status(500).json({ err });
  }
};
