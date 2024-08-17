const { startBrowser } = require("../../lib/puppeteer");
const { JSDOM } = require("jsdom");
const UserAgent = require("user-agents");
const urlTeam = `https://www.basketball-reference.com/teams`;

async function getElement(page, selector) {
  const tableElement = await page.$eval(`${selector}`, (el) => el.outerHTML);
  const tableDOM = new JSDOM(tableElement);
  const { document } = tableDOM.window;
  return document;
}

function _getInfoPlayer({ row }) {
  const number = row.querySelector('[data-stat="number"]')?.textContent;
  const player = row.querySelector('[data-stat="player"]')?.textContent;
  const playerRef = row.querySelector("a")?.href;
  const playerPos = row.querySelector('[data-stat="pos"]')?.textContent;
  const playerCountry = row.querySelector(
    '[data-stat="birth_country"]'
  )?.textContent;
  const infoPlayer = {
    number,
    name: player,
    position: playerPos,
    country: playerCountry,
    href: playerRef,
  };
  return infoPlayer;
}

async function _getRoster({ page }) {
  const tableDocument = await getElement(page, `#all_roster>div>table`);
  const rows = tableDocument.querySelectorAll("tbody>tr");
  const roster = [...rows].map((row) => {
    return _getInfoPlayer({ row });
  });
  return roster;
}

module.exports = async (req, res) => {
  try {
    const { codeTeam, year } = req.body;
    const url = `${urlTeam}/${codeTeam}/${year}.html`;
    const browser = await startBrowser();
    const page = await browser.newPage();
    const userAgent = new UserAgent();
    await page.setUserAgent(userAgent.toString());
    await page.setViewport({
      width: 1920,
      height: 1080,
    });
    await page.goto(url);
    const roster = await _getRoster({ page: page });
    await browser.close();
    res.status(200).json({ response: roster });
  } catch (err) {
    console.log(err);
    res.status(500).json({ err });
  }
};
