import { remapChromeApi } from "./chrome-extension-async";
console.debug("loading api");

/** @type {browser} */
let api = undefined;

let apiName = undefined;

try {
  api = browser;
  console.debug("Firefox API detected.");
  apiName = "browser";
} catch {
  console.debug("Fail to detect Firefox API");
}

if (api === undefined) {
  try {
    api = chrome;
    console.debug("Chrome API detected.");
    apiName = "chrome";
    remapChromeApi();
  } catch {
    console.debug("Fail to detect Chrome API");
  }
}

if (api === undefined) {
  throw Error("can not guess the API");
}

export { api, apiName };
