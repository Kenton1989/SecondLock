import { generalTranslate } from "./translation.js";

let thisYear = new Date(Date.now()).getFullYear();

// set copyright ending year
let copyEndYear = document.getElementById("copy-end-year");
if (copyEndYear != undefined) copyEndYear.innerText = thisYear;

generalTranslate();
