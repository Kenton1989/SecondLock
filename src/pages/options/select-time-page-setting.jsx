import React, { Component } from "react";
import { assertOptions } from "../../common/options-manager";
import { $t } from "../../common/utility";

export default class SelectTimeSetting extends Component {
  constructor(props) {
    super(props);
    
    assertOptions(props.options, "defDurations");

    this.state = {
      defDurInput: "",
    };

    this.setDefDurInput = (val) => this.setState({ defDurInput: val });
  }

  render() {
    return (
      <div className="section-2">
        <h3>
          {$t("durSelectPage")}&nbsp;|&nbsp;
          <a href="./select-time.html" target="_blank">
            {$t("preview")}
          </a>
        </h3>
        <h4 className="unsaved-hint-default-time" id="def-dur-choice-title">
          {$t("defDurChoices")}
        </h4>
        <p className="description">{$t("setDefDurDescription")}</p>
        <details className="description">
          <summary>{$t("defDurFormatSummary")}</summary>
          <ul>
            <li>{$t("defDurFormat1")}</li>
            <li>{$t("defDurFormat2")}</li>
            <li>{$t("defDurFormat3")}</li>
          </ul>
        </details>
        <input
          type="text"
          onChange={(e) => this.setDefDurInput(e.target.value)}
          value={this.state.defDurInput}
        />
        <button id="save-default-time-btn">{$t("save")}</button>
      </div>
    );
  }
}
