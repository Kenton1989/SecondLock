import React, { useState } from "react";
import { render } from "react-dom";

import "./index.css";
import DurationSelection from "./duration-selection";

render(
  <DurationSelection />,
  window.document.querySelector("#app-container")
);

if (module.hot) module.hot.accept();
