import React from "react";
import { $t } from "../../common/utility";

export default class CountdownTimer extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      remain: undefined,
    };

    this.timerHandle = undefined;
  }

  render() {
    console.debug("rendering counter", this.state);
    let display = "--:--:--";

    let remain = this.remainTime();
    if (remain >= 0) {
      // format the rest time to HH:MM:SS format
      display = new Date(remain).toISOString().substr(11, 8);
    }

    return (
      <div className="countdown-timer">
        <span>{$t("remainTime")}</span>
        <div className="remain-time">{display}</div>
      </div>
    );
  }

  componentWillUnmount() {
    if (this.timerHandle !== undefined) {
      window.clearInterval(this.timerHandle);
    }
  }

  remainTime() {
    // no end time point is set
    if (!this.props.endTime || this.props.endTime <= Date.now()) {
      return -1;
    }

    // already set remain time
    if (this.state.remain !== undefined) return this.state.remain;

    // set up remain time and update every second
    let mSec = this.props.endTime - Date.now();

    if (mSec >= 1000) {
      this.timerHandle = window.setInterval(() => {
        let now = Date.now();
        if (now >= this.props.endTime) {
          window.clearInterval(this.timerHandle);
          this.timerHandle = undefined;
          this.setState({ remain: 0 });
        } else {
          this.setState({ remain: this.props.endTime - now });
        }
      }, 1000);
    }

    return mSec;
  }
}
