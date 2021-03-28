import React, { Component, createRef } from "react";
import { asyncAlert } from "../../common/utility";

function mkRefs(number) {
  return new Array(number).fill(undefined).map(() => createRef());
}

const DEFAULT_FUNC = {
  getInput: (ref) => ref.current.value,
  setInput: (ref, val) => (ref.current.value = val),
  onSave: (val) => val,

  // verify the data and return a error message
  verify: (val) => "",
};

function makeOptionNeedSave(
  template,
  option,
  refs,
  methods = DEFAULT_FUNC,
  params = {
    detectEnter: true,
  }
) {
  methods = Object.assign(DEFAULT_FUNC, methods);
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
        await onSave(val);
        setInput(inputEle, val);
        unsavedHint.current.style.opacity = 0;
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
function makeOptionAutoSave(template, refs, methods) {}

export { makeOptionNeedSave, makeOptionAutoSave, mkRefs };
