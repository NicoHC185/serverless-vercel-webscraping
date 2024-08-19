const { JSDOM } = require("jsdom");
const { Browser, Page } = require("puppeteer");
const puppeteer = require("puppeteer-extra");
const puppeteerCore = require("puppeteer-core");
const Adblocker = require("puppeteer-extra-plugin-adblocker");
const chromium = require("@sparticuz/chromium");

export async function initialBrowserCore() {
  puppeteer.use(Adblocker({ blockTrackers: true }));
  return puppeteer.launch({
    args: [...chromium.args, "--hide-scrollbars", "--disable-web-security"],
    defaultViewport: chromium.defaultViewport,
    executablePath: await chromium.executablePath(
      `https://github.com/Sparticuz/chromium/releases/download/v126.0.0/chromium-v126.0.0-pack.tar`
    ),
    headless: chromium.headless,
    ignoreHTTPSErrors: true,
  });
}

export const initialBrowser = async () => {
  try {
    const config = {
      args: [
        "--hide-scrollbars",
        "--disable-web-security",
        "--no-sandbox",
        "--disable-setuid-sandbox",
      ],
      ignoreHTTPSErrors: true,
      headless: true,
      defaultViewport: chromium.defaultViewport,
    };
    puppeteer.use(Adblocker({ blockTrackers: true }));
    const browser = await puppeteer.launch(config);
    return browser;
  } catch (err) {
    throw new Error(err.message);
  }
};

export const startBrowser = async () => {
  return process.env.ENV === "DEV" ? await initialBrowser() : await initialBrowserCore();
}

export const closeBrowser = async (browser) => {
  await browser.close();
};
