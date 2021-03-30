import React, { Component, createRef } from "react";
import { asyncAlert, blinkElement } from "../../common/utility";

function mkRefs(number) {
  return new Array(number).fill(undefined).map(() => createRef());
}

const DEFAULT_FUNC_NEED_SAVE = {
  getInput: (ref) => ref.current.value,
  setInput: (ref, val) => (ref.current.value = val),
  onSave: (val) => console.log(val),

  // verify the data and return a error message
  verify: (val) => "",
};

// Create a element type that contains a button used to save
// value from input
function makeOptionNeedSave(
  template,
  option,
  refs,
  methods = DEFAULT_FUNC_NEED_SAVE,
  params = {
    detectEnter: true,
  }
) {
  methods = Object.assign({}, DEFAULT_FUNC_NEED_SAVE, methods);
  let { unsavedHint, saveBtn, inputEle } = refs;
  let { getInput, setInput, onSave, verify } = methods;
  let { detectEnter } = params;

  return class extends Component {
    constructor(props) {
      super(props);
      this.setInputValue = (val) => setInput(inputEle, val);
      this.dirty = false;
    }

    componentDidMount() {
      option.doOnUpdated(this.setInputValue);

      unsavedHint.current.style.opacity = 0;

      let save = async () => {
        if (!this.dirty) {
          console.log("No editing happens, skip saving");
          return;
        }
        let val = getInput(inputEle);
        let errMsg = verify(val);
        if (errMsg) {
          asyncAlert(errMsg);
          return;
        }

        inputEle.current.disabled = true;
        saveBtn.current.disabled = true;
        await onSave(val);
        setInput(inputEle, val);
        unsavedHint.current.style.opacity = 0;
        inputEle.current.disabled = false;
        saveBtn.current.disabled = false;
        this.dirty = false;
      };

      saveBtn.current.onclick = save;

      if (detectEnter) {
        inputEle.current.onkeydown = (e) => {
          if (e.key === "Enter") save();
        };
      }

      inputEle.current.oninput = () => {
        unsavedHint.current.style.opacity = 1;
        this.dirty = true;
      };
    }

    componentWillUnmount() {
      option.removeDoOnUpdated(this.setInputValue);
    }

    render() {
      return <>{template}</>;
    }
  };
}

const DEFAULT_FUNC_AUTO_SAVE = {
  getInput: (ref) => ref.current.value,
  setInput: (ref, val) => (ref.current.value = val),
  onSave: (val) => console.log(val),
  // verify the data and return an error message
  verify: (val) => "",
};

// Create a option item that will do auto saving
function makeOptionAutoSave(
  template,
  option,
  refs,
  methods = DEFAULT_FUNC_AUTO_SAVE,
  params = {
    autoSaveDelay: 1000,
  }
) {
  methods = Object.assign({}, DEFAULT_FUNC_NEED_SAVE, methods);
  let { savedHint, inputEle } = refs;
  let { getInput, setInput, onSave, verify } = methods;
  let { autoSaveDelay } = params;

  return class extends Component {
    constructor(props) {
      super(props);

      this.delayHandle = undefined;

      this.setInputValue = (val) => setInput(inputEle, val);
      this.save = this.save.bind(this);
      this.delayedSave = this.delayedSave.bind(this);
    }

    componentDidMount() {
      option.doOnUpdated(this.setInputValue);

      savedHint.current.style.opacity = 0;

      inputEle.current.oninput = () => {
        this.delayedSave();
      };
    }

    componentWillUnmount() {
      option.removeDoOnUpdated(this.setInputValue);
    }

    render() {
      return <>{template}</>;
    }

    async save() {
      let val = getInput(inputEle);
      let errMsg = verify(val);
      if (errMsg) {
        asyncAlert(errMsg);
        return;
      }

      inputEle.current.disabled = true;
      await onSave(val);
      inputEle.current.disabled = false;
      blinkElement(savedHint.current, 1, 4000, false);
    }

    delayedSave() {
      if (this.delayHandle !== undefined) {
        window.clearTimeout(this.delayHandle);
        delete this.delayHandle;
      }
      getInput(inputEle);
      this.delayHandle = window.setTimeout(this.save, autoSaveDelay);
    }
  };
}

export { makeOptionNeedSave, makeOptionAutoSave, mkRefs };
