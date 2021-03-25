import React, { useState } from "react";
import MainUI from "../components/main-ui";
import { $t, closeCurrentTab } from "../../common/utility";
import { api } from "../../common/api.js";
import { dynamicInit } from "../js/dynamic-page.js";
import { OptionCollection } from "../../common/options-manager.js";
import { RemoteCallable } from "../../common/remote-callable.js";

import { TabBlocker } from "../../common/tab-blocker";
import LineEdit from "../components/line-edit";
import { number } from "prop-types";

const options = new OptionCollection("defDurations");
// TabBlocker.autoUnblock();

class DefaultDurButtonList extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      durList: [],
    };
    options.defDurations.doOnUpdated((list) =>
      this.setState({ durList: list })
    );
  }
  render() {
    return (
      <div className="def-dur-button-list">
        {this.state.durList.map((val) => (
          <button
            key={val}
            onClick={() => {
              this.props.doOnSelect(val);
            }}
          >
            {val} {val === 1 ? $t("min") : $t("mins")}
          </button>
        ))}
      </div>
    );
  }
}

const MINUTE = 60000;
const MIN_UNLOCK_MINUTES = 1;
const MAX_UNLOCK_MINUTES = 1439;

export default class DurationSelection extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      blockedHost: undefined,
      unlockDur: "",
      unlockEndTime: this.calDefaultEndTimePoint(),
    };

    this.unlockMinutes = this.unlockMinutes.bind(this);
  }

  componentDidMount() {
    dynamicInit((args) => {
      this.setState({ blockedHost: args.blockedHost });
    });
  }

  render() {
    let displayedHost = this.state.blockedHost || "example.com";

    return (
      <MainUI title={$t("durSelectTitle")}>
        <h1>{$t("durSelectHint")}</h1>
        <h2 className="blocked-link">{displayedHost}</h2>
        <DefaultDurButtonList doOnSelect={this.unlockMinutes} />
        <div id="other-length">
          <LineEdit
            type="number"
            onEnter={() => {
              this.state.unlockDur
                ? this.unlockMinutes(parseFloat(this.state.unlockDur))
                : alert($t("EmptyInputWarn"));
            }}
            onChange={(e) => {
              this.setState({ unlockDur: e.target.value });
            }}
            value={this.state.unlockDur}
          />
          <span> {$t("mins")} </span>
          <button
            onClick={() => {
              this.state.unlockDur
                ? this.unlockMinutes(parseFloat(this.state.unlockDur))
                : alert($t("EmptyInputWarn"));
            }}
          >
            GO
          </button>
        </div>
        <div>
          <span>{$t("orUntilTimePoint")}</span>
          <input type="time" name="end-time-point" id="end-time-point-input" />
          <button id="enter-time-point-btn">GO</button>
        </div>
        <button id="close-all">
          <span>{$t("closeAllRelated")}</span>
        </button>
      </MainUI>
    );
  }

  unlockMinutes(minutes) {
    if (!this.state.blockedHost) {
      alert($t("noBlockedDetect"));
      return;
    }

    console.debug(`Unlock ${this.state.blockedHost} for ${minutes} mins.`);

    if (minutes < MIN_UNLOCK_MINUTES) {
      alert(` ${$t("minimumUnlockTime")}${MIN_UNLOCK_MINUTES} ${$t("min")}`);
      return;
    } else if (minutes > MAX_UNLOCK_MINUTES) {
      alert(` ${$t("maximumUnlockTime")}${MAX_UNLOCK_MINUTES} ${$t("mins")}`);
      return;
    }

    let unlockDuration = Math.round(minutes * MINUTE);
    RemoteCallable.call("lock-time-monitor", "setTimerFor", [
      this.state.blockedHost,
      unlockDuration,
    ]).then(() => {
      TabBlocker.notifyUnblock(this.state.blockedHost);
      closeCurrentTab();
    });
  }

  calDefaultEndTimePoint() {
    let time = new Date(Date.now());
    let curH = time.getHours();
    let curM = time.getMinutes();

    // advance to nearest half hour / full hour
    // but at least 1 minutes unlock time is guaranteed
    const MIN_UNLOCK_TIME = 1;
    if (curM < 30 - MIN_UNLOCK_TIME) {
      time.setMinutes(30);
    } else if (curM >= 60 - MIN_UNLOCK_TIME) {
      time.setMinutes(30);
      time.setHours(curH + 1);
    } else {
      time.setMinutes(0);
      time.setHours(curH + 1);
    }

    return time;
  }

  getHHMM(time) {
    if (typeof time === "number") time = new Date(time);
    return time.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
      hourCycle: "h23",
    });
  }
}
