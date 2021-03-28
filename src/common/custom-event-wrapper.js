class CustomEventWrapper {
  /**
   * Construct a event manager backing with given key and target object
   * @param {String} eventType type of event
   * @param {EventTarget} eventTarget backing event target object
   */
  constructor(eventType, eventTarget) {
    this._eventKey = eventType;
    this._eventTarget = eventTarget;
    this._callbackMap = new Map();
  }

  /**
   * Add a listener for event.
   *
   * Each callback will only be called once every time the event happens.
   *
   * Repeating adding the same callback function object will not result the callback
   * being called for multiple time.
   *
   * @param {function(...)} callback callback function
   */
  addListener(callback) {
    if (this._callbackMap.has(callback)) return;

    let wrappedCallback = (e) => callback(...e.detail);
    this._callbackMap.set(callback, wrappedCallback);
    this._eventTarget.addEventListener(this._eventKey, wrappedCallback);
  }

  /**
   * Remove a listener for event added through this.addListener
   *
   * @param {function(...)} callback callback function, must be
   *  the same object passed to this.addListener
   */
  removeListener(callback) {
    let wrappedCallback = this._callbackMap.get(callback);
    if (!wrappedCallback) return;
    this._eventTarget.removeEventListener(this._eventKey, wrappedCallback);
  }

  /**
   * Trigger the event with the given arguments.
   *
   * @param  {...any} args arguments passed to the callback functions
   */
  trigger(...args) {
    let event = new CustomEvent(this._eventKey, { detail: args });
    this._eventTarget.dispatchEvent(event);
  }
}

export { CustomEventWrapper };
