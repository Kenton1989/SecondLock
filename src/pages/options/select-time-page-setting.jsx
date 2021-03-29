import React, { Component, createRef } from "react";
import { assertOptions } from "../../common/options-manager";
import { $t } from "../../common/utility";
import { makeOptionNeedSave, mkRefs } from "./option-item";

/**
 * parse a string into a list of integer
 * @param {string} str input string
 */
function parseIntList(
  str,
  min = 1,
  max = 1440,
  maxCount = 10,
  separator = ","
) {
  let strVals = str.split(separator);
  let valSet = new Set();
  for (let val of strVals) {
    if (valSet.size >= maxCount) break;

    val = val.trim();
    if (!val.match(/^[0-9]+$/)) continue;
    val = parseInt(val, 10);

    if (min <= val && val <= max) {
      valSet.add(val);
    }
  }
  return [...valSet].sort((a, b) => a - b);
}

export default class SelectTimeSetting extends Component {
  constructor(props) {
    super(props);

    assertOptions(props.options, "defDurations");

    this.state = {
      defDurInput: "",
    };

    this.setDefDurInput = (val) => this.setState({ defDurInput: val });

    // create option for default duration selection
    {
      let refs = mkRefs(3);
      console.debug(refs);
      let [unsavedHint, saveBtn, inputEle] = refs;
      let option = this.props.options.defDurations;
      this.DefUnlockDurOption = makeOptionNeedSave(
        <div>
          <h4>
            {$t("defDurChoices")}{" "}
            <span ref={unsavedHint} className="unsaved-tag">
              {$t("unsavedHint")}
            </span>
          </h4>
          <details className="description">
            <summary>{$t("setDefDurDescription")}</summary>
            <p>{$t("defDurFormatSummary")}</p>
            <ul>
              <li>{$t("defDurFormat1")}</li>
              <li>{$t("defDurFormat2")}</li>
              <li>{$t("defDurFormat3")}</li>
            </ul>
          </details>
          <input type="text" ref={inputEle} />
          <button ref={saveBtn}>{$t("save")}</button>
        </div>,
        option,
        { unsavedHint, saveBtn, inputEle },
        {
          getInput: (ref) => parseIntList(ref.current.value),
          setInput: (ref, val) => (ref.current.value = val),
          onSave: (val) => option.set(val),
        }
      );
    }
  }

  render() {
    let DefUnlockDurOption = this.DefUnlockDurOption;
    return (
      <div className="section-2">
        <h3>
          {$t("durSelectPage")}&nbsp;|&nbsp;
          <a href="./select-time.html" target="_blank">
            {$t("preview")}
          </a>
        </h3>
        <DefUnlockDurOption />
      </div>
    );
  }
}
