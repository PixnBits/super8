import React, { useState, useEffect } from 'react';

import comms from '../comms';

function Controls() {
  const [isProjectorBusy, setBusyState] = useState(false);
  const [contrast, setContrastState] = useState(0);
  const [saturation, setSaturationState] = useState(0);
  useEffect(() => {
    const busyListener = () => setBusyState(true);
    const idleListener = () => setBusyState(false);
    const cameraSettingsListener = (event) => {
      const { notification } = event;
      const { settings } = notification;
      if ('contrast' in settings) {
        setContrastState(settings.contrast);
      }
      if ('saturation' in settings) {
        setSaturationState(settings.saturation);
      }
    };
    comms.addEventListener('busy', busyListener);
    comms.addEventListener('idle', idleListener);
    comms.addEventListener('cameraSettings', cameraSettingsListener);
    return () => {
      comms.removeEventListener('busy', busyListener);
      comms.removeEventListener('idle', idleListener);
      comms.removeEventListener('cameraSettings', cameraSettingsListener);
    };
  });

  // TODO: debounce calls to comm.setContrast & setSaturation
  return (
    <>
      <p>
        <button type="button" className="btn btn-primary" disabled={isProjectorBusy} onClick={() => comms.captureAndAdvance()}>Capture and Advance</button>
        <button type="button" className="btn btn-danger" onClick={() => comms.stop()}>Stop</button>
        <button type="button" className="btn btn-primary" disabled={isProjectorBusy} onClick={() => comms.advanceFrame()}>Advance Frame</button>
        <button type="button" className="btn btn-primary" disabled={isProjectorBusy} onClick={() => comms.captureFrame()}>Capture Frame</button>
        <button type="button" className="btn btn-secondary" disabled={isProjectorBusy} onClick={() => comms.advance()}>Advance</button>
      </p>
      <p>
        <label>
          Contrast:
          <input type="number" min="-100" max="100" step="1" value={contrast} onChange={(event) => comms.setContrast(event.target.value)}/>
        </label>
        <label>
          Saturation
          <input type="number" min="-100" max="100" step="1" value={saturation} onChange={(event) => comms.setSaturation(event.target.value)}/>
        </label>
      </p>
    </>
  );
}

export default Controls;
