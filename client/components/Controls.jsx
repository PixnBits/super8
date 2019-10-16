import React, { useState, useEffect } from 'react';

import comms from '../comms';

function Controls() {
  const [isProjectorBusy, setBusyState] = useState(false);
  const [contrast, setContrastState] = useState(0);
  const [saturation, setSaturationState] = useState(0);
  const [cameraBrightness, setCameraBrightnessState] = useState(50);
  const [lampBrightness, setLampBrightnessState] = useState(25);
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
        setCameraBrightnessState(settings.brightness);
      }
    };
    const cameraLampBrightnessListener = (event) => {
      const { notification } = event;
      const { brightness } = notification;
      setLampBrightnessState(brightness);
    };
    comms.addEventListener('busy', busyListener);
    comms.addEventListener('idle', idleListener);
    comms.addEventListener('cameraSettings', cameraSettingsListener);
    comms.addEventListener('lampBrightness', cameraLampBrightnessListener);
    return () => {
      comms.removeEventListener('busy', busyListener);
      comms.removeEventListener('idle', idleListener);
      comms.removeEventListener('cameraSettings', cameraSettingsListener);
      comms.removeEventListener('lampBrightness', cameraLampBrightnessListener);
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
      <label htmlFor="lamp-brightness-setting">
        Brightness
        <input
          id="lamp-brightness-setting"
          type="range"
          min="0"
          max="255"
          step="1"
          value={lampBrightness}
          onChange={(event) => comms.setLampBrightness(parseInt(event.target.value, 10))}
        />
      </label>
      </p>
      <p>
        <label htmlFor="contrast-setting">
          Contrast:
          <input
            id="contrast-setting"
            type="range"
            min="-100"
            max="100"
            step="1"
            value={contrast}
            onChange={(event) => comms.setContrast(parseInt(event.target.value, 10))}
          />
        </label>
        <label htmlFor="saturation-setting">
          Saturation
          <input
            id="saturation-setting"
            type="range"
            min="-100"
            max="100"
            step="1"
            value={saturation}
            onChange={(event) => comms.setSaturation(parseInt(event.target.value, 10))}
          />
        </label>
        <label htmlFor="camera-brightness-setting">
          Brightness
          <input
            id="camera-brightness-setting"
            type="range"
            min="0"
            max="100"
            step="1"
            value={cameraBrightness}
            onChange={(event) => comms.setCameraBrightness(parseInt(event.target.value, 10))}
          />
        </label>
      </p>
    </React.Fragment>
  );
}

export default Controls;
