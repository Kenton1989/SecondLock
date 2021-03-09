import { remapChromeApi } from "./chrome-extension-async.js";

const api = chrome ? chrome : browser ? browser : undefined;
if (api == undefined) {
  throw Error("can not guess the API");
}

if (!chrome) {
  remapChromeApi();
}

export { api };
