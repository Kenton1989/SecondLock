import React from "react";
import { $t } from "../../common/utility.js";

export default class CountdownTimer extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      remain: undefined
    };
    
    if (props.endTime) {
      let mSec = props.endTime - Date.now();
      this.setState({ remain: mSec });
      
      if (mSec >= 100) {
        let offset = (mSec % 1000) - 100;
        if (offset < 50) offset += 1000;
        
        let thisComp = this;
        window.setTimeout(function () {
          let handle = window.setInterval(function () {
            let now = Date.now();
            if (now >= props.endTime) {
              window.clearInterval(handle);
              thisComp.setState({ remain: 0 });
            } else {
              thisComp.setState({ remain: props.endTime - now });
            }
          }, 1000);
        }, offset);
      }
    }
  }
  render() {
    let display = "--:--:--";

    if (this.state.remain !== undefined && this.state.remain >= 0) {
      // format the rest time to HH:MM:SS format
      display = new Date(this.state.remain).toISOString().substr(11, 8);
    }

    return (
      <div className="countdown-timer">
        <span>{$t("remainTime")}</span>
        <div className="remain-time">{display}</div>
      </div>
    );
  }
}
