const { JSDOM } = require("jsdom");

export const urlTeam = `https://www.basketball-reference.com/teams`;
export const url = `https://www.basketball-reference.com/leagues/`;

export async function getElement(page, selector) {
  const tableElement = await page.$eval(`${selector}`, (el) => el.outerHTML);
  const tableDOM = new JSDOM(tableElement);
  const { document } = tableDOM.window;
  return document;
}

export function bodyJSON(body) {
  if (typeof body === "string") {
    return JSON.parse(body);
  } else {
    return body;
  }
}
