import { remapChromeApi } from "./chrome-extension-async.js";
console.debug("loading api");
const api = chrome ? chrome : browser ? browser : undefined;
console.debug(api);
if (api == undefined) {
  throw Error("can not guess the API");
}

// map chrome api to Promise based
if (chrome) {
  console.debug("chrome API detected.")
  remapChromeApi();
}

export { api };
