import React from 'react';

import FrameImage from './FrameImage';
import comms from '../comms';

const App = () => (
  <>
    <header>
      <div className="navbar navbar-dark bg-dark shadow-sm">
        <div className="container d-flex justify-content-between">
          <strong className="navbar-brand">Super 8 Projector Control</strong>
        </div>
      </div>
    </header>
    <main>
      <p>Appy!</p>
      <FrameImage />
      <p>
        Controls (Advance Frame, Advance, Stop)
        <button type="button" class="btn btn-danger" onClick={() => comms.stop()}>Stop</button>
        <button type="button" class="btn btn-primary" onClick={() => comms.advanceFrame()}>Advance Frame</button>
        <button type="button" class="btn btn-secondary" onClick={() => comms.advance()}>Advance</button>
      </p>
    </main>
  </>
);

export default App;
