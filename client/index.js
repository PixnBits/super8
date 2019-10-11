// https://parceljs.org/recipes.html#bootstrap-+-fontawesome
import 'bootstrap/dist/css/bootstrap.css';

import React from 'react';
import reactDOM from 'react-dom';

import './comms.js';
import App from './components/App.jsx';

reactDOM.render(<App />, document.querySelector('main'));
