const { setTimeout } = require("timers/promises");
const {
  initialBrowser,
  closeBrowser,
  initialBrowserCore,
  startBrowser,
} = require("../lib/puppeteer");
const UserAgent = require("user-agents");
const { JSDOM } = require("jsdom");
const { url } = require("../utils");

function _getTeams({ teamsHTML }) {
  const teams = [...teamsHTML].map((el) => {
    const href = el?.querySelector("td>a")?.getAttribute("href");
    const code = href?.split("/")[2].toLowerCase() || "";
    const regex = /\(|\)/g;
    const textContentSplit =
      el?.textContent?.replace("F$", "").replace(regex, "-").split("-") || [];
    const name = textContentSplit[0];
    const victories = Number(textContentSplit[1]) || 0;
    const defeats = Number(textContentSplit[2]) || 0;
    return {
      name,
      victories,
      defeats,
      code: String(code).toUpperCase(),
    };
  });
  return teams;
}

function _getConferences(el) {
  const name = el.getElementsByTagName("h4")[0]?.textContent;
  const teamsElements = el.querySelectorAll("table>tbody>tr");
  let teams = _getTeams({ teamsHTML: teamsElements }).sort((a, b) =>
    a.victories < b.victories ? 1 : -1
  );
  return {
    name: name,
    teams: teams,
  };
}

const GetTeams = async (res) => {
  const browser = await startBrowser();
  const page = await browser.newPage();
  const userAgent = new UserAgent();
  await page.setUserAgent(userAgent.toString());
  await page.setViewport({
    width: 1920,
    height: 1080,
  });
  await page.goto(url);
  await page.hover("#header_teams");
  setTimeout(300);
  const elements = await page.$$eval("#header_teams>div>.list", (el) =>
    el.map((item) => item.outerHTML)
  );
  const data = elements.map((el) => {
    const DOM = new JSDOM(el);
    return _getConferences(DOM.window.document);
  });
  await closeBrowser(browser);
  return data;
};

module.exports = async (req, res) => {
  try {
    if (req.method === "GET") {
      const data = await GetTeams();
      res.status(200).json({ response: data });
    }
  } catch (err) {
    res.status(500).json({ err });
  }
};
