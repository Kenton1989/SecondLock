
class Storage {
  
}

let localStorage = chrome.storage.local
let mainStorage = chrome.storage.local
localStorage.get("storageOption", function(type){
  if (type == "sync") mainStorage = chrome.storage.sync;
});

export {mainStorage, localStorage}