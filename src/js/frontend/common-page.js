import { generalTranslate } from "/js/translation.js";

let thisYear = new Date(Date.now()).getFullYear();

// set copyright ending year
let copyEndYear = document.getElementById("copy-end-year");
if (copyEndYear != undefined) copyEndYear.innerText = thisYear;

generalTranslate();

// Short name for selectors
function $(selector, element = document) {
  return element.querySelector(selector);
}

function $$(selector, element = document) {
  return element.querySelectorAll(selector);
}

function $id(id, element = document) {
  return element.getElementById(id);
}

function $cls(cls, element = document) {
  return element.getElementsByClassName(cls);
}

// Translate
function $t(msgKey, ...param) {
  return chrome.i18n.getMessage(msgKey, ...param);
}

export { $, $$, $id, $cls, $t };
