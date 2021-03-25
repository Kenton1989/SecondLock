import React from 'react';
import { $t } from '../../common/utility';
import './Popup.css';

const Popup = () => {
  return (
    <div>
      <section id="page-info">
        <p>{$t("currentHost")}</p>
        <p id="current-host"></p>
      </section>
      <section>
        <div id="timer-display">
          <span>{$t("remainTime")}</span>
          <div id="remain-time">--:--:--</div>
        </div>
        <button id="stop-timer-btn" style={{ display: "none" }}>{$t("stopTimingClose")}</button>
      </section>
      <section id="links-div">
        <a id="go-options" href="./options.html">{$t("optionsTitle")}</a>
      </section>
      <script type="module" src="js/popup-page.js"></script>
    </div>
  );
};

export default Popup;
