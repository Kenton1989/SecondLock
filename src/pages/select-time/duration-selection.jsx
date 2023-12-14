import React from "react";
import { $t, asyncAlert } from "../../common/utility";
import { api } from "../../common/api";
import { dynamicInit } from "../js/dynamic-page";
import { OptionCollection } from "../../common/options-manager";
import RemoteCallable from "../../common/remote-callable";

import EnterableInput from "../components/enterable-input";

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
const MIN_UNLOCK_MINUTES = 0.1;
const MAX_UNLOCK_MINUTES = 1440;
const MIN_UNLOCK_MS = MIN_UNLOCK_MINUTES * MINUTE;
const MAX_UNLOCK_MS = MAX_UNLOCK_MINUTES * MINUTE;
const ONE_DAY = 86400000; // ms of one day

export default class DurationSelection extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      blockedHost: undefined,
      unlockDur: "",
      unlockReminder: "",
      unlockEndTime: toHHMM(calDefaultEndTimePoint()),
    };

    this.reminderRef = React.createRef();

    this.blockedTabId = undefined;

    this.unlockMs = this.unlockMs.bind(this);
    this.enterMinutes = this.enterMinutes.bind(this);
    this.enterEndTime = this.enterEndTime.bind(this);
    this.closeRelevant = this.closeRelevant.bind(this);
  }

  componentDidMount() {
    dynamicInit((args) => {
      this.blockedTabId = args.blockedTabId;
      this.setState({ blockedHost: args.blockedHost });
    });
    this.reminderRef.current.focus();
  }

  render() {
    let displayedHost = this.state.blockedHost || "example.com";
    return (
      <div>
        <h1>{$t("durSelectHint")}</h1>
        <h2 className="blocked-link">{displayedHost}</h2>
        <div id="reminder">
          <span>Reminder: </span>
          <EnterableInput
            onChange={(e) => {
              this.setState({ unlockReminder: e.target.value });
            }}
            forwardRef={this.reminderRef}
            value={this.state.unlockReminder}
          />
        </div>
        <DefaultDurButtonList
          doOnSelect={(val) => this.unlockMs(val * MINUTE)}
        />
        <div id="other-length">
          <EnterableInput
            type="number"
            onEnter={this.enterMinutes}
            onChange={(e) => {
              this.setState({ unlockDur: e.target.value });
            }}
            value={this.state.unlockDur}
          />
          <span> {$t("mins")} </span>
          <button onClick={this.enterMinutes}>GO</button>
        </div>
        <div>
          <span>{$t("orUntilTimePoint")} </span>
          <EnterableInput
            type="time"
            onEnter={this.enterEndTime}
            onChange={(e) => {
              this.setState({ unlockEndTime: e.target.value });
            }}
            value={this.state.unlockEndTime}
          />
          <button onClick={this.enterEndTime}>GO</button>
        </div>
        <button onClick={this.closeRelevant}>{$t("closeAllRelated")}</button>
      </div>
    );
  }

  async unlockMs(ms) {
    if (!this.state.blockedHost) {
      asyncAlert($t("noBlockedDetect"));
      return;
    }

    if (!this.state.unlockReminder) {
      asyncAlert($t("noReminder"));
      this.reminderRef.current.focus();
      return;
    }

    if (ms < MIN_UNLOCK_MS) {
      asyncAlert(
        ` ${$t("minimumUnlockTime")}${MIN_UNLOCK_MINUTES} ${$t("min")}`
      );
      return;
    } else if (ms > MAX_UNLOCK_MS) {
      asyncAlert(
        ` ${$t("maximumUnlockTime")}${MAX_UNLOCK_MINUTES} ${$t("mins")}`
      );
      return;
    }

    let unlockDuration = Math.round(ms);
    await RemoteCallable.call(
      "lock-time-monitor",
      "setTimerFor",
      [this.state.blockedHost, unlockDuration]
    );

    // try to go back to the blocked tab
    if (this.blockedTabId !== undefined) {
      try {
        await api.tabs.update(this.blockedTabId, { active: true });
      } catch (e) {
        // tab is not found, do nothing
        console.warn(e);
      }
    }
    RemoteCallable.call("background-aux", "closeExtPageAbout", [
      this.state.blockedHost,
    ], false);
  }

  enterMinutes() {
    this.state.unlockDur
      ? this.unlockMs(parseFloat(this.state.unlockDur) * MINUTE)
      : asyncAlert($t("emptyInputWarn"));
  }

  enterEndTime() {
    let nowMs = Date.now();
    let time = new Date(nowMs);
    let hour = parseInt(this.state.unlockEndTime.substr(0, 2));
    let min = parseInt(this.state.unlockEndTime.substr(3, 2));
    time.setHours(hour);
    time.setMinutes(min);
    time.setSeconds(0);
    let endTime = time.getTime();
    if (endTime - nowMs <= 0) {
      endTime += ONE_DAY;
    } else if (endTime - nowMs < MIN_UNLOCK_MS) {
      endTime = nowMs + MIN_UNLOCK_MS;
    }
    this.unlockMs(endTime - nowMs);
  }

  closeRelevant() {
    if (this.state.blockedHost) {
      RemoteCallable.call(
        "background-aux",
        "closeRelativePages",
        [this.state.blockedHost],
        false
      );
    } else {
      asyncAlert($t("noBlockedDetect"));
    }
  }
}

function calDefaultEndTimePoint() {
  let time = new Date(Date.now());
  let curH = time.getHours();
  let curM = time.getMinutes();

  // advance to nearest half hour / full hour
  // but at least 1 minutes unlock time is guaranteed
  if (curM < 30 - MIN_UNLOCK_MINUTES) {
    time.setMinutes(30);
  } else if (curM >= 60 - MIN_UNLOCK_MINUTES) {
    time.setMinutes(30);
    time.setHours(curH + 1);
  } else {
    time.setMinutes(0);
    time.setHours(curH + 1);
  }

  return time;
}

function toHHMM(time) {
  if (typeof time === "number") time = new Date(time);
  return time.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  });
}
