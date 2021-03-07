import { TRANS_KEYS } from "./trans-keys.js";

const SUPPORTED_LANG = new Set(["zh-CN"]);

function canTranslate() {
  let langCode = chrome.i18n.getUILanguage();
  console.debug("Lang code: " + langCode);
  return SUPPORTED_LANG.has(langCode);
}

function generalTranslate(transKeys = TRANS_KEYS) {
  if (!canTranslate()) {
    console.debug(`No translation applied.`);
    return;
  }
  for (const key of transKeys) {
    let elements = document.getElementsByClassName(`trans-${key}`);
    let txt = chrome.i18n.getMessage(key);
    for (const ele of elements) {
      // use innerHTML to allow simple styling
      ele.innerHTML = txt;
    }
  }
}

export { generalTranslate };
