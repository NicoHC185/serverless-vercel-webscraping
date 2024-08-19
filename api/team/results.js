const { startBrowser } = require("../../lib/puppeteer");
const UserAgent = require("user-agents");
const { getElement, bodyJSON } = require("../../utils");
const urlTeam = `https://www.basketball-reference.com/teams`;

async function _getGameResult({ page }) {
  const document = await getElement(page, `#timeline_results`);
  const result = [...document.querySelectorAll("ul>li")]
    .filter((el) => el.className === "result")
    .map((el) => {
      const textSplit = String(el.textContent).split(",");
      const dateSplit = textSplit[0]
        .replace(/(\r\n|\n|\r)/gm, "")
        .split(".")[1]
        .split(" ");
      const teamsSplit = textSplit[1].split(" ");
      const date = `${dateSplit[1]} ${dateSplit[2]}`;
      const teams = [teamsSplit[1], teamsSplit.slice(-1)[0]];
      const result = teamsSplit[2].match(/\d+/g);
      const score = String(textSplit[2])
        .replace(/(\r\n|\n|\r)/gm, "")
        .split(" ")[1]
        .split("-");
      return {
        date,
        teams,
        result,
        score,
      };
    });
  return result;
}

module.exports = async (req, res) => {
  try {
    const { codeTeam, year } = bodyJSON(req.body);
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
    const result = await _getGameResult({ page: page });
    await browser.close();
    res.status(200).json({ response: result });
  } catch (err) {
    console.log(err);
    res.status(500).json({ err });
  }
};
