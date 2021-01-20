
const kExtName = chrome.i18n.getMessage('extname');

let thisYear = new Date(Date.now()).getFullYear();

function main() {
  // set copyright ending year
  let copyEndYear = document.getElementById("copy-end-year");
  if (copyEndYear != undefined)
    copyEndYear.innerText = thisYear;

  // common translation
  let extNameList = document.getElementsByClassName("ext-name");
  for (const element of extNameList) {
    element.innerText = kExtName;
  }

}

window.addEventListener("load", main);
