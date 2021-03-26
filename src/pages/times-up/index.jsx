import React from "react";
import { render } from "react-dom";
import "./index.css";
import TimesUpPage from "./times-up-page";

render(
  <TimesUpPage/>,
  window.document.querySelector("#app-container")
);

if (module.hot) module.hot.accept();
