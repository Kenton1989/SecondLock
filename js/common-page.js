

let thisYear = new Date(Date.now()).getFullYear();

function main() {
  // set copyright ending year
  let copyEndYear = document.getElementById("copy-end-year");
  if (copyEndYear != undefined)
    copyEndYear.innerText = thisYear;
}

window.addEventListener("load", main);
