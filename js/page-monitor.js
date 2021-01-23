import {validHostname} from "./utility.js";

class PageMonitor {
  #monitoredHost = new Set();
  #matchingRegex = ``;
  constructor() {
    
  }

  addMonitoredHost(hostname) {}
  hasMonitoredHost(hostname) {}
  removeMonitoredHost(hostname) {}
  addReaction(callback) {}
}

export {PageMonitor};
