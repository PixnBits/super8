// https://parceljs.org/recipes.html#bootstrap-+-fontawesome
import 'bootstrap/dist/css/bootstrap.css';

import React from 'react';
import reactDOM from 'react-dom';

import './comms';
import App from './components/App';

/*
 "Warning: render(): Rendering components directly into document.body is
  discouraged, since its children are often manipulated by third-party scripts
  and browser extensions. This may lead to subtle reconciliation issues. Try
  rendering into a container element created for your app."

  We want to avoid div-soup and be as semantic as we can.
  We don't want any third-party scripts doing such cringy things anyway.
  Browser extensions might be an issue, let's not compromise right now and see
  where we get.
*/
reactDOM.render(<App />, document.body);
