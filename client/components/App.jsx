import React from 'react';

import FrameImage from './FrameImage';
import Controls from './Controls';

const App = () => (
  <React.Fragment>
    <header>
      <div className="navbar navbar-dark bg-dark shadow-sm">
        <div className="container d-flex justify-content-between">
          <strong className="navbar-brand">Super 8 Projector Control</strong>
        </div>
      </div>
    </header>
    <main>
      <Controls />
      <FrameImage />
    </main>
  </React.Fragment>
);

export default App;
