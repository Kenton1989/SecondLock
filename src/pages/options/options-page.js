/**
 * This is the js for options.html
 */
import { api } from "../../common/api.js"
import "./common-page.js";
import { HostnameSet } from "./hostname-set.js";
import { setupSectionNav } from "./nav-setup.js";
import { ALL_OPTION_NAME, OptionCollection } from "./options-manager.js";
import {
  reformatHostname,
  validHostname,
  validIPv4Address,
  validIPv6Hostname,
  validIPv6Address,
  showTxt,
  formatBytes,
  $cls,
  $id,
  $t,
} from "../../common/utility.js";

let options = new OptionCollection(...ALL_OPTION_NAME);

const kEmptyInputWarn = $t("emptyInputWarn");
const kUnknownHostFormat = $t("unknownHostFormatWarn");
const kHostMonitoredWarn = $t("hostMonitoredWarn");

//////////////////////// monitored list //////////////////////////
/**
 * Make a host list item.
 * @param {String} host the hostname stored in the item
 */
let makeHostListItem = (function () {
  // Local variable encapsulation
  let tempItem = $cls("host-list-item")[0];
  let hostnameTxt = $cls("host", tempItem)[0];

  // actual function
  return function (host) {
    // Set hostname before clone the node.
    hostnameTxt.innerText = host;
    let item = tempItem.cloneNode(true);
    let deleteBtn = $cls("delete-btn", item)[0];
    let undoBtn = $cls("undo-btn", item)[0];

    undoBtn.style.display = "none";
    // delete and undo buttons will hide themselves, display the other one
    // and modify the deletion tag of this item
    deleteBtn.onclick = function () {
      item.classList.add("deleted");
      deleteBtn.style.display = "none";
      undoBtn.style.display = "block";
    };
    undoBtn.onclick = function () {
      item.classList.remove("deleted");
      undoBtn.style.display = "none";
      deleteBtn.style.display = "block";
    };

    return item;
  };
})();

/**
 * Add a list of hostname into the given element
 * @param {String[]} hosts array of hostname
 * @param {Element} hostListElement the element to put the list
 * @param {HostnameSet} hostSet the set of hostname
 */
function setHostList(hosts, hostListElement, hostSet = undefined) {
  if (hostSet) {
    hostSet.clear();
    hostSet.addList(hosts);
    hosts = [...hostSet];
  }
  hosts.sort();
  hostListElement.replaceChildren();
  let items = hosts.map((host) => makeHostListItem(host));
  hostListElement.append(...items);
}

/**
 * Setup hostname input division
 * @param {String[]} hosts array of hostname
 * @param {Element} hostList the division element
 * @param {function(String[])} onSaveHostList callback when the hostname list is saved
 */
function setUpHostListDiv(hosts, hostListDiv, onSaveHostList = function () {}) {
  // set of hostname already in the list
  let hostSet = new HostnameSet(hosts);
  let dirty = false;
  hostListDiv.hostSet = hostSet;

  // get the host list and setup
  let hostList = $cls("host-list", hostListDiv)[0];
  setHostList(hosts, hostList, hostSet);

  // prepare the element to display warning
  let warning = $cls("warning", hostListDiv)[0];

  // prepare elements for user input
  let userInput = $cls("host-input", hostListDiv)[0];
  let addHostBtn = $cls("add-host-btn", hostListDiv)[0];

  let enterHost = function () {
    let input = userInput.value.trim();
    // warn for empty input
    if (!input) {
      showTxt(warning, kEmptyInputWarn);
      return;
    }

    // Format the input hostname.
    let hostname = "";
    if (
      validHostname(input) ||
      validIPv4Address(input) ||
      validIPv6Hostname(input)
    ) {
      hostname = reformatHostname(input);
    } else if (validIPv6Address(input)) {
      // Square brackets are needed for IPv6 hostname.
      hostname = reformatHostname(`[${input}]`);
    } else {
      // warn for bad format
      showTxt(warning, kUnknownHostFormat);
      return;
    }

    // warn for entering existing hostname
    if (hostSet.has(hostname)) {
      showTxt(warning, kHostMonitoredWarn);
      return;
    }

    // accept input hostname
    userInput.value = "";
    warning.replaceChildren();
    let item = makeHostListItem(hostname);
    item.classList.add("unsaved");
    hostSet.add(hostname);
    dirty = true;
    hostList.appendChild(item);
  };

  addHostBtn.onclick = enterHost;
  userInput.onkeydown = function (e) {
    // Shortcut for entering
    if (e.key == "Enter") enterHost();
  };

  // prepare for saving list
  let saveListBtn = $cls("save-host-btn", hostListDiv)[0];
  saveListBtn.onclick = function () {
    // filter out the deleted item
    let items = hostList.childNodes;
    for (const item of items) {
      if (!item.classList.contains("deleted")) continue;
      let host = $cls("host", item)[0];
      dirty = hostSet.remove(host.innerText) || dirty;
    }

    if (dirty) {
      onSaveHostList([...hostSet]);
      dirty = false;
    } else {
      console.log("Host list is not modified. Skip saving.");
    }

    warning.replaceChildren();
  };
}

setupSectionNav();

//////////////////// monitored host list ///////////////////////
let blacklistHostDiv = $id("blacklist-host");
let blacklistHostListEle = $cls("host-list", blacklistHostDiv)[0];
setUpHostListDiv([], blacklistHostDiv, function (list) {
  console.log(list);
  setHostList(list, blacklistHostListEle);
  options.monitoredList.set(list);
});

options.monitoredList.doOnUpdated(function (list) {
  setHostList(list, blacklistHostListEle, blacklistHostDiv.hostSet);
});

///////////////////// Whitelist ////////////////////////
let whitelistHostDiv = $id("whitelist-host");
let whitelistHostListEle = $cls("host-list", whitelistHostDiv)[0];
setUpHostListDiv([], whitelistHostDiv, function (list) {
  console.log(list);
  setHostList(list, whitelistHostListEle);
  options.whitelistHost.set(list);
});

options.whitelistHost.doOnUpdated(function (list) {
  setHostList(list, whitelistHostListEle, whitelistHostDiv.hostSet);
});

///////////////////// Notification //////////////////////////
// TODO - add notification functions
options.notificationOn.doOnUpdated(function (notiOn) {});

{
  let notiOnChecker = $id("notification-on");
  let notiCountDownDiv = $id("notification-countdowns");
  notiCountDownDiv.style.display = notiOnChecker.checked ? "block" : "none";

  notiOnChecker.onchange = function () {
    notiCountDownDiv.style.display = notiOnChecker.checked ? "block" : "none";
  };
}
//////////////////// Active Days ///////////////////////////
// TODO - add active days support

/////////////////////// Page Blocking & Closing ///////////////////////

// Duration Selection Page
{
  let defaultDurInput = $id("default-time");
  let defaultDurSave = $id("save-default-time-btn");
  let lastSaveDefDur = [];
  const MIN_DUR_MIN = 1;
  const MAX_DUR_MIN = 1000;
  const MAX_DUR_CNT = 10;

  function loadDefaultDurations(list) {
    defaultDurInput.value = list.toString();
  }

  const defDurChoiceTitle = $id("def-dur-choice-title");

  function saveDefaultDuration(str) {
    // clear unsaved tag
    defDurChoiceTitle.classList.remove("unsaved");

    if (str == lastSaveDefDur.toString()) {
      console.log("list is not changed. Skip saving.");
      return;
    }

    let sList = str.split(",");
    let inputArr = sList.map((s) => parseInt(s));
    inputArr = inputArr.filter((val) => {
      return typeof val == "number" && val >= MIN_DUR_MIN && val <= MAX_DUR_MIN;
    });
    let res = new Set(inputArr);
    let list = [...res].slice(0, MAX_DUR_CNT);
    list = list.sort((a, b) => a - b);

    // set without checking dirtiness to clear potential invalid values
    loadDefaultDurations(list);

    if (list.toString() == lastSaveDefDur.toString()) {
      console.log("list is not changed. Skip saving.");
      return;
    }
    lastSaveDefDur = list;
    options.defDurations.set(list);
  }

  options.defDurations.doOnUpdated(function (durList) {
    lastSaveDefDur = durList;
    loadDefaultDurations(durList);
  });

  defaultDurSave.onclick = function () {
    saveDefaultDuration(defaultDurInput.value);
  };

  defaultDurInput.oninput = function () {
    defDurChoiceTitle.classList.add("unsaved");
  };

  defaultDurInput.onkeydown = function (keyInfo) {
    if (keyInfo.key == "Enter") saveDefaultDuration(defaultDurInput.value);
  };
}

// Time's Up Page
{
  let pageOnTimesUp = $id("page-on-times-up");
  let defTimesUpPageDiv = $id("default-times-up-page-settings");
  let timesUpPagePreview = $id("times-up-page-preview");

  function updateDivDisplay() {
    let isDefault = pageOnTimesUp.value == "default";
    defTimesUpPageDiv.style.display = isDefault ? "block" : "none";
    timesUpPagePreview.style.display = isDefault ? "inline" : "none";
  }

  pageOnTimesUp.onchange = updateDivDisplay;

  updateDivDisplay();
}

////////////////////// storage & sync ////////////////////////
let cloudUseSpaceTxt = $id("cloud-used-space");
api.storage.sync.getBytesInUse(undefined).then(function (val) {
  cloudUseSpaceTxt.innerText = formatBytes(val);
});

let cloudMaxSpaceTxt = $id("cloud-max-space");
cloudMaxSpaceTxt.innerText = formatBytes(api.storage.sync.QUOTA_BYTES);

// TODO - add syncing support
