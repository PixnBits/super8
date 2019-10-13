import React from 'react';

import comms from '../comms';

function Controls() {
  return (
    <p>
      <button type="button" class="btn btn-danger" onClick={() => comms.stop()}>Stop</button>
      <button type="button" class="btn btn-primary" onClick={() => comms.advanceFrame()}>Advance Frame</button>
      <button type="button" class="btn btn-secondary" onClick={() => comms.advance()}>Advance</button>
    </p>
  );
}

export default Controls;
