import React, { Component } from "react";
import { assertOptions } from "../../common/options-manager";
import { $t } from "../../common/utility";
import { makeOptionAutoSave, makeOptionNeedSave, mkRefs } from "./option-item";

export default class TimesUpSetting extends Component {
  constructor(props) {
    super(props);

    assertOptions(props.options, "timesUpPageType", "mottos");

    this.state = {
      timesUpPageType: "default",
    };

    this.setTimesUpPageType = (val) => {
      this.setState({ timesUpPageType: val });
    };

    // create option for mottos on times up page
    {
      let [unsavedHint, saveBtn, inputEle] = mkRefs(3);
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
          verify: (val) =>
            val[0].length > MAX_LENGTH ? `${$t("tooManyChar")}` : "",
        },
        { detectEnter: false }
      );
    }

    // create option for times up page type setting.
    {
      let [savedHint, inputEle] = mkRefs(2);
      let option = this.props.options.timesUpPageType;

      this.TimesUpPageTypeOption = makeOptionAutoSave(
        <div>
          {$t("pageDisplayedOnTimesUp")}:&nbsp;
          <select
            ref={inputEle}
            onChange={(e) => this.setTimesUpPageType(e.target.value)}
          >
            <option value="none">{$t("noPage")}</option>
            <option value="default">{$t("default")}</option>
            <option value="newtab">{$t("newTabPage")}</option>
          </select>
          <span ref={savedHint} className="auto-save-tag">
            {$t("autoSavedHint")}
          </span>
        </div>,
        option,
        { savedHint, inputEle },
        {
          onSave: (val) => option.set(val),
        }
      );
    }
  }

  componentDidMount() {
    this.props.options.timesUpPageType.doOnUpdated(this.setTimesUpPageType);
  }

  componentWillUnmount() {
    this.props.options.timesUpPageType.removeDoOnUpdated(
      this.setTimesUpPageType
    );
  }

  render() {
    let { MottoSetting, TimesUpPageTypeOption } = this;
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
        <TimesUpPageTypeOption />
        {this.state.timesUpPageType === "default" && <MottoSetting />}
      </div>
    );
  }
}
