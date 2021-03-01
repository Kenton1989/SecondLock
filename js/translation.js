
const TRANS_KEYS = [

]

function generalTranslate() {
  for (const key of TRANS_KEYS) {
    let elements = document.getElementsByClassName(`trans-${key}`);
    let txt = chrome.i18n.getMessage(key);
    for (const ele of elements) {
      // use innerHTML to allow simple styling
      ele.innerHTML = txt;
    }
  }
}

export {generalTranslate};