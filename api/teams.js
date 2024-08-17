const { setTimeout } = require("timers/promises");
const {
  initialBrowser,
  closeBrowser,
  initialBrowserCore,
  startBrowser,
} = require("../lib/puppeteer");
const UserAgent = require("user-agents");
const { JSDOM } = require("jsdom");

const urlTeam = `https://www.basketball-reference.com/teams`;
const url = `https://www.basketball-reference.com/leagues/`;

async function getElement(page, selector) {
  const tableElement = await page.$eval(`${selector}`, (el) => el.outerHTML);
  const tableDOM = new JSDOM(tableElement);
  const { document } = tableDOM.window;
  return document;
}

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

async function _getInfoTeam({ page }) {
  const teamDocument = await getElement(
    page,
    `[data-template="Partials/Teams/Summary"]`
  );
  const name = teamDocument
    .getElementsByTagName("h1")[0]
    .querySelectorAll("span")[1].textContent;

  const info = [...teamDocument.querySelectorAll("p")].map((el) => {
    const newText = String(el.textContent)
      .replace(/[\n\t]+/g, "")
      .split(" ")
      .filter((el) => el !== "")
      .join(" ");
    return newText;
  });
  const res = {
    name: name,
    record: info.find((el) => /Record/.test(el))?.split(":")[1] || "",
    coach: info.find((el) => /Coach/.test(el))?.split(":")[1] || "",
    executive: info.find((el) => /Executive/.test(el))?.split(":")[1] || "",
  };
  return res;
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

async function getTeamByCode({ codeTeam, year, res }) {
  const url = `${urlTeam}/${codeTeam}/${year}.html`;
  const browser =
    process.env.ENV === "DEV"
      ? await initialBrowser()
      : await initialBrowserCore();
  const page = await browser.newPage();
  const userAgent = new UserAgent();
  await page.setUserAgent(userAgent.toString());
  await page.setViewport({
    width: 1920,
    height: 1080,
  });
  await page.goto(url);
  const infoTeam = await _getInfoTeam({ page: page });
  await browser.close();
  return infoTeam;
}

module.exports = async (req, res) => {
  try {
    if (req.method === "GET") {
      const data = await GetTeams();
      res.status(200).json({ response: data });
    } else if (req.method === "POST") {
      const data = await getTeamByCode({ ...req.body, res });
      res.status(200).json({ response: data });
    }
  } catch (err) {
    res.status(500).json({ err });
  }
};
