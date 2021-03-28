import React, { Component } from "react";
import { assertOptions } from "../../common/options-manager";
import { $t } from "../../common/utility";

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
  }

  render() {
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
        {this.state.timesUpPageType === "default" && (
          <div>
            <h4>{$t("motto")}</h4>
            <details className="description">
              <summary>{$t("timesUpMottoDetail")}</summary>
              <ul>
                <li>{$t("mottosDetail1")}</li>
                <li>{$t("mottosDetail2")}</li>
              </ul>
            </details>
            <textarea id="times-up-mottos"></textarea>
            <button id="save-times-up-settings">{$t("save")}</button>
          </div>
        )}
      </div>
    );
  }
}
