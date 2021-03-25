import { RemoteCallable } from "./remote-callable.js";

class NotificationManager extends RemoteCallable {
  constructor(name) {
    super(name);
    this._active = false;
    this._timePoints = [];
    this._notiMap = new Map();
  }
}

export { NotificationManager };
