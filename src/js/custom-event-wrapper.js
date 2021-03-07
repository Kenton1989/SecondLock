class CustomEventWrapper {
  #eventKey;
  #eventTarget;
  /**
   * Construct a event manager backing with given key and target object
   * @param {String} eventType type of event
   * @param {EventTarget} eventTarget backing event target object
   */
  constructor(eventType, eventTarget) {
    this.#eventKey = eventType;
    this.#eventTarget = eventTarget;
  }

  /**
   * Add a listener for event.
   *
   * @param {function(...)} callback callback function
   */
  addListener(callback) {
    this.#eventTarget.addEventListener(this.#eventKey, function (e) {
      callback(...e.detail);
    });
  }

  /**
   * Trigger the event with the given arguments.
   *
   * @param  {...any} args arguments passed to the callback functions
   */
  trigger(...args) {
    let event = new CustomEvent(this.#eventKey, { detail: args });
    this.#eventTarget.dispatchEvent(event);
  }
}

export { CustomEventWrapper };
