import React, { useState, useEffect } from 'react';

import comms from '../comms';

function Controls() {
  const [isProjectorBusy, setBusyState] = useState(false);
  useEffect(() => {
    const busyListener = () => setBusyState(true);
    const idleListener = () => setBusyState(false);
    comms.addEventListener('busy', busyListener);
    comms.addEventListener('idle', idleListener);
    return () => {
      comms.removeEventListener('busy', busyListener);
      comms.removeEventListener('idle', idleListener);
    };
  });

  return (
    <p>
      <button type="button" class="btn btn-primary" disabled={isProjectorBusy} onClick={() => comms.captureAndAdvance()}>Capture and Advance</button>
      <button type="button" class="btn btn-danger" onClick={() => comms.stop()}>Stop</button>
      <button type="button" class="btn btn-primary" disabled={isProjectorBusy} onClick={() => comms.advanceFrame()}>Advance Frame</button>
      <button type="button" class="btn btn-primary" disabled={isProjectorBusy} onClick={() => comms.saveFrame()}>Save Frame</button>
      <button type="button" class="btn btn-secondary" disabled={isProjectorBusy} onClick={() => comms.advance()}>Advance</button>
    </p>
  );
}

export default Controls;
