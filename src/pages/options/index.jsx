import React from 'react';
import { render } from 'react-dom';
import { $t } from '../../common/utility';
import MainUI from "../components/main-ui"

import './index.css';

render(
  <MainUI title={$t("optionsTitle")}>
  </MainUI>,
  window.document.querySelector('#app-container')
);

if (module.hot) module.hot.accept();
