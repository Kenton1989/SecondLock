class CustomEventWrapper {
  /**
   * Construct a event manager backing with given key and target object
   * @param {String} eventType type of event
   * @param {EventTarget} eventTarget backing event target object
   */
  constructor(eventType, eventTarget) {
    this._eventKey = eventType;
    this._eventTarget = eventTarget;
  }

  /**
   * Add a listener for event.
   *
   * @param {function(...)} callback callback function
   */
  addListener(callback) {
    this._eventTarget.addEventListener(this._eventKey, function (e) {
      callback(...e.detail);
    });
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
