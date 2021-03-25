import React from 'react';
import { render } from 'react-dom';

import './index.css';

render(
  <div>Hello World 2</div>,
  window.document.querySelector('#app-container')
);

if (module.hot) module.hot.accept();
