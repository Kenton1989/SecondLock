import { CustomEventWrapper } from "./custom-event-wrapper.js";
import { mainStorage } from "./storage.js";

let allOptionNameList = ["monitoredList", "activated"];
let allOptionNameSet = new Set(allOptionNameList);

class Option {
  #eventTarget;
  #onUpdatedEvent;
  #storageKey;
  #value = undefined;
  constructor(name, eventTarget = undefined) {
    if (!allOptionNameSet.has(name)) {
      throw new ReferenceError(`Create invalid option: ${thisOption}.`);
    }

    if (eventTarget == undefined) this.eventTarget = new EventTarget();
    this.#onUpdatedEvent = new CustomEventWrapper(
      `${name}-option-updated`,
      this.#eventTarget
    );

    this.#storageKey = `${name}Option`;
    let thisOption = this;
    mainStorage.get(this.#storageKey, function (value) {
      thisOption.setCached(value);
    });

    // make private member accessible in the callback.
    let storageKey = this.#storageKey;
    mainStorage.onChanged.addListener(function (changes) {
      if (changes[storageKey]) {
        thisOption.setCached(changes[storageKey].newValue);
      }
    });
  }
  getCached() {
    return this.#value;
  }
  setCached(value) {
    if (Object.is(value, this.#value)) return;

    let oldValue = this.#value;
    this.#value = value;
    this.#onUpdatedEvent.trigger(value, oldValue);
  }
  set(value, callback = undefined) {
    if (Object.is(value, this.#value)) {
      callback && callback();
      return;
    }
    mainStorage.set(this.#storageKey, value, callback);
  }
  doOnUpdated(callback) {
    if (this.#value != undefined) callback(this.#value);
    this.#onUpdatedEvent.addListener(callback);
  }
}

class OptionCollection {
  #eventTarget = new EventTarget();

  constructor(...optionNames) {
    // remove duplication
    let optionSet = new Set(optionNames);

    for (const option of optionSet) {
      if (!allOptionNameSet.has(option)) {
        throw new ReferenceError(`Referring invalid option: ${option}.`);
      }
      Object.defineProperty(this, option, {
        value: new Option(option, this.#eventTarget),
        writable: false,
      });
    }
  }
}

export { allOptionNameList, allOptionNameSet, OptionCollection };
