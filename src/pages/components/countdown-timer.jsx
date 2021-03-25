import React from "react";
import { $t } from "../../common/utility.js";

export default class CountdownTimer extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      remain: undefined,
    };
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

  remainTime() {
    // no end time point is set
    if (!this.props.endTime || this.props.endTime <= Date.now()) {
      return -1;
    }

    // already set remain time
    if (this.state.remain !== undefined) return this.state.remain;

    // set up remain time and update every second
    let mSec = this.props.endTime - Date.now();
    
    if (mSec >= 100) {

      let offset = (mSec % 1000) - 100;
      if (offset < 50) offset += 1000;
      
      console.log("initial offset:", offset);
      
      window.setTimeout(() => {
        let handle = window.setInterval(() => {
          let now = Date.now();
          if (now >= this.props.endTime) {
            window.clearInterval(handle);
            this.setState({ remain: 0 });
          } else {
            this.setState({ remain: this.props.endTime - now });
          }
        }, 1000);
      }, offset);
    }

    return mSec;
  }
}
