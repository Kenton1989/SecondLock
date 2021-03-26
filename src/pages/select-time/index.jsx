import React from "react";
import { render } from "react-dom";
import { $t } from "../../common/utility";

import "./index.css";
import DurationSelection from "./duration-selection";
import MainUI from "../components/main-ui";

render(
  <MainUI title={$t("durSelectTitle")}>
    <DurationSelection />
  </MainUI>,
  window.document.querySelector("#app-container")
);

if (module.hot) module.hot.accept();
