import { $cls } from "./utility.js.js.js";
import { TRANS_KEYS } from "./trans-keys.js";
import { api } from "./api.js.js.js";

const SUPPORTED_LANG = new Set(["zh-CN"]);

function canTranslate() {
  let langCode = api.i18n.getUILanguage();
  console.debug("Lang code: " + langCode);
  return SUPPORTED_LANG.has(langCode);
}

function generalTranslate(transKeys = TRANS_KEYS) {
  if (!canTranslate()) {
    console.debug(`No translation applied.`);
    return;
  }
  for (const key of transKeys) {
    let txt = api.i18n.getMessage(key);

    let elements = $cls(`trans-${key}`);
    for (const ele of elements) {
      // use innerHTML to allow simple styling
      ele.innerHTML = txt;
    }

    let phElements = $cls(`transPh-${key}`);
    for (const ele of phElements) {
      ele.placeholder = txt;
    }
  }
}

export { generalTranslate };
