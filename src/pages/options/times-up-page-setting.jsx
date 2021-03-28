import React, { Component } from "react";
import { assertOptions } from "../../common/options-manager";
import { $t } from "../../common/utility";
import { makeOptionNeedSave, mkRefs } from "./option-item";

export default class TimesUpSetting extends Component {
  constructor(props) {
    super(props);

    assertOptions(props.options, "leaveOneTab", "mottos");

    this.state = {
      leaveOneTab: true,
      mottoInput: "",
      timesUpPageType: "default",
    };

    this.setLeaveOneTab = (val) => this.setState({ leaveOneTab: val });
    this.setMottoInput = (val) => this.setState({ mottoInput: val });
    this.setTimesUpPageType = (val) => this.setState({ timesUpPageType: val });

    // create option for mottos on times up page
    {
      let refs = mkRefs(3);
      console.debug(refs);
      let [unsavedHint, saveBtn, inputEle] = refs;
      let option = this.props.options.mottos;
      const MAX_LENGTH = 300;
      this.MottoSetting = makeOptionNeedSave(
        <div>
          <h4>
            {$t("motto")}&nbsp;
            <span ref={unsavedHint} className="unsaved-tag">
              {$t("unsavedHint")}
            </span>
          </h4>
          <details className="description">
            <summary>{$t("timesUpMottoDetail")}</summary>
            <ul>
              <li>{$t("mottosDetail1")}</li>
              <li>{$t("mottosDetail2")}</li>
            </ul>
          </details>
          <textarea id="times-up-mottos" ref={inputEle}></textarea>
          <button ref={saveBtn}>{$t("save")}</button>
        </div>,
        option,
        { unsavedHint, saveBtn, inputEle },
        {
          getInput: (ref) => [ref.current.value],
          setInput: (ref, val) => (ref.current.value = val[0]),
          onSave: (val) => option.set(val),
          verify: (val) => (val[0].length > MAX_LENGTH ? `${$t("tooManyChar")}` : ""),
        },
        { detectEnter: false }
      );
    }
  }

  render() {
    let { MottoSetting } = this;

    return (
      <div className="section-2">
        <h3>
          <span>{$t("timesUpPage")}</span>
          {this.state.timesUpPageType === "default" && (
            <span>
              &nbsp;|&nbsp;
              <a href="./times-up.html" target="_blank">
                {$t("preview")}
              </a>
            </span>
          )}
        </h3>
        <div>
          {$t("pageDisplayedOnTimesUp")}:&nbsp;
          <select
            onChange={(e) => this.setTimesUpPageType(e.target.value)}
            value={this.state.timesUpPageType}
          >
            <option value="none">{$t("noPage")}</option>
            <option value="default">{$t("default")}</option>
            <option value="newtab">{$t("newTabPage")}</option>
          </select>
        </div>
        {this.state.timesUpPageType === "default" && <MottoSetting />}
      </div>
    );
  }
}
