import React, { Component } from "react";
import { assertOptions } from "../../common/options-manager";
import { $t } from "../../common/utility";
import { makeOptionAutoSave, mkRefs } from "./option-item";
import SelectTimeSetting from "./select-time-page-setting";
import TimesUpSetting from "./times-up-page-setting";

export default class PageBlocking extends Component {
  constructor(props) {
    super(props);
    assertOptions(props.options, "leaveOneTab");
    this.state = {
      leaveOneTab: true,
      defDurInput: "",
      mottoInput: "",
      timesUpPageType: "default",
    };

    // create option item for leave one tab option
    {
      let [savedHint, inputEle] = mkRefs(2);
      let option = this.props.options.leaveOneTab;

      this.LeaveOneTab = makeOptionAutoSave(
        <div>
          <input id="leave-one-tab" type="checkbox" ref={inputEle} />
          <label htmlFor="leave-one-tab">{$t("leaveOneTabDescribe")}</label>
          &nbsp;
          <span ref={savedHint} className="auto-save-tag">
            {$t("autoSavedHint")}
          </span>
        </div>,
        option,
        { savedHint, inputEle },
        {
          getInput: (ref) => ref.current.checked,
          setInput: (ref, val) => (ref.current.checked = val),
          onSave: (val) => option.set(val),
        }
      );
    }

    // create option item for times up page type option
    {
      let [savedHint, inputEle] = mkRefs(2);
      let option = this.props.options.leaveOneTab;

      this.LeaveOneTab = makeOptionAutoSave(
        <div>
          <input id="leave-one-tab" type="checkbox" ref={inputEle} />
          <label htmlFor="leave-one-tab">{$t("leaveOneTabDescribe")}</label>
          &nbsp;
          <span ref={savedHint} className="auto-save-tag">
            {$t("autoSavedHint")}
          </span>
        </div>,
        option,
        { savedHint, inputEle },
        {
          getInput: (ref) => ref.current.checked,
          setInput: (ref, val) => (ref.current.checked = val),
          onSave: (val) => option.set(val),
        }
      );
    }
  }

  render() {
    let LeaveOneTab = this.LeaveOneTab;
    return (
      <div>
        <div>
          <h3>{$t("pageClosingTitle")}</h3>
          <LeaveOneTab />
        </div>
        <SelectTimeSetting options={this.props.options} />
        <TimesUpSetting options={this.props.options} />
      </div>
    );
  }
}
