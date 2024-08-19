const UserAgent = require("user-agents");
const { startBrowser } = require("../../lib/puppeteer");
const { urlTeam, getElement, bodyJSON } = require("../../utils");

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

async function getTeamByCode({ codeTeam, year, res }) {
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
  const infoTeam = await _getInfoTeam({ page: page });
  await browser.close();
  return infoTeam;
}

module.exports = async (req, res) => {
  try {
    if (req.method === "POST") {
      const data = await getTeamByCode({ ...bodyJSON(req.body), res });
      res.status(200).json({ response: data });
    }
  } catch (err) {
    console.log(err);
    res.status(500).json({ err });
  }
};
