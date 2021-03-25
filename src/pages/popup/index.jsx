import React from 'react';
import { render } from 'react-dom';

import Popup from './Popup';
import './index.css';

render(<Popup />, window.document.querySelector('#app-container'));

class CurHostDisplay extends React.Component {
    constructor(props) {
        super(props);
        this.state.curHost = "example.com";
    }
    render() {
        return 
    }
}

if (module.hot) module.hot.accept();
