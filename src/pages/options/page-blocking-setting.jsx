import React, { Component } from "react";
import { assertOptions } from "../../common/options-manager";
import { $t } from "../../common/utility";
import SelectTimeSetting from "./select-time-page-setting";
import TimesUpSetting from "./times-up-page-setting";

export default class PageBlocking extends Component {
  constructor(props) {
    super(props);
    assertOptions(props.options, "leaveOneTab", "defDurations", "mottos");
    this.state = {
      leaveOneTab: true,
      defDurInput: "",
      mottoInput: "",
      timesUpPageType: "default",
    };

    this.setLeaveOneTab = (val) => this.setState({ leaveOneTab: val });
    this.setDefDurInput = (val) => this.setState({ defDurInput: val });
    this.setMottoInput = (val) => this.setState({ mottoInput: val });
    this.setTimesUpPageType = (val) => this.setState({ timesUpPageType: val });
  }

  componentDidMount() {}
  render() {
    return (
      <div>
        <div>
          <h3>{$t("pageClosingTitle")}</h3>
          <input
            id="leave-one-tab"
            type="checkbox"
            onChange={(e) => this.setLeaveOneTab(e.target.checked)}
            checked={this.state.leaveOneTab}
          />
          <label htmlFor="leave-one-tab">{$t("leaveOneTabDescribe")}</label>
        </div>
        <SelectTimeSetting options={this.props.options} />
        <TimesUpSetting options={this.props.options} />
      </div>
    );
  }
}
