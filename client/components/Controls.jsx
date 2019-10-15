import React, { useState, useEffect } from 'react';

import comms from '../comms';

function Controls() {
  const [isProjectorBusy, setBusyState] = useState(false);
  const [contrast, setContrastState] = useState(0);
  const [saturation, setSaturationState] = useState(0);
  const [brightness, setBrightnessState] = useState(50);
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
      if ('brightness' in settings) {
        setBrightnessState(settings.brightness);
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
    <React.Fragment>
      <p>
        <button type="button" className="btn btn-primary" disabled={isProjectorBusy} onClick={() => comms.captureAndAdvance()}>Capture and Advance</button>
        <button type="button" className="btn btn-danger" onClick={() => comms.stop()}>Stop</button>
        <button type="button" className="btn btn-primary" disabled={isProjectorBusy} onClick={() => comms.advanceFrame()}>Advance Frame</button>
        <button type="button" className="btn btn-primary" disabled={isProjectorBusy} onClick={() => comms.captureFrame()}>Capture Frame</button>
        <button type="button" className="btn btn-secondary" disabled={isProjectorBusy} onClick={() => comms.advance()}>Advance</button>
      </p>
      <p>
        <label htmlFor="contrast-setting">
          Contrast:
          <input
            id="contrast-setting"
            type="number"
            min="-100"
            max="100"
            step="1"
            value={contrast}
            onChange={(event) => comms.setContrast(event.target.value)}
          />
        </label>
        <label htmlFor="saturation-setting">
          Saturation
          <input
            id="saturation-setting"
            type="number"
            min="-100"
            max="100"
            step="1"
            value={saturation}
            onChange={(event) => comms.setSaturation(event.target.value)}
          />
        </label>
        <label htmlFor="brightness-setting">
          Brightness
          <input
            id="brightness-setting"
            type="number"
            min="0"
            max="100"
            step="1"
            value={brightness}
            onChange={(event) => comms.setBrightness(event.target.value)}
          />
        </label>
      </p>
    </React.Fragment>
  );
}

export default Controls;
