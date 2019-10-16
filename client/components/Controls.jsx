import React, { useState, useEffect } from 'react';

import comms from '../comms';

function Controls() {
  // projector
  const [isProjectorBusy, setBusyState] = useState(false);
  const [contrast, setContrastState] = useState(0);
  const [lampBrightness, setLampBrightnessState] = useState(25);
  const [advanceSpeed, setAdvanceSpeedState] = useState(3200);
  // camera
  const [saturation, setSaturationState] = useState(0);
  const [cameraBrightness, setCameraBrightnessState] = useState(50);
  useEffect(() => {
    // projector
    const busyListener = () => setBusyState(true);
    const idleListener = () => setBusyState(false);
    const cameraLampBrightnessListener = (event) => {
      const { notification } = event;
      const { brightness } = notification;
      setLampBrightnessState(brightness);
    };
    const advanceSpeedListener = (event) => {
      const { notification } = event;
      const { speed } = notification;
      setAdvanceSpeedState(speed);
    };
    // camera
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
    // projector
    comms.addEventListener('busy', busyListener);
    comms.addEventListener('idle', idleListener);
    comms.addEventListener('lampBrightness', cameraLampBrightnessListener);
    comms.addEventListener('advanceSpeed', advanceSpeedListener);
    // camera
    comms.addEventListener('cameraSettings', cameraSettingsListener);
    return () => {
      // projector
      comms.removeEventListener('busy', busyListener);
      comms.removeEventListener('idle', idleListener);
      comms.removeEventListener('lampBrightness', cameraLampBrightnessListener);
      comms.removeEventListener('advanceSpeed', advanceSpeedListener);
      // camera
      comms.removeEventListener('cameraSettings', cameraSettingsListener);
    };
  });

  // TODO: debounce calls to comm.setContrast & setSaturation
  return (
    <React.Fragment>
      <h3>Projector</h3>
      <p>
        <button type="button" className="btn btn-primary mr-2" disabled={isProjectorBusy} onClick={() => comms.captureAndAdvance()}>Capture and Advance</button>
        <button type="button" className="btn btn-danger mr-2" onClick={() => comms.stop()}>Stop</button>
        <button type="button" className="btn btn-primary mr-2" disabled={isProjectorBusy} onClick={() => comms.advanceFrame()}>Advance Frame</button>
        <button type="button" className="btn btn-primary mr-2" disabled={isProjectorBusy} onClick={() => comms.captureFrame()}>Capture Frame</button>
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
            className="ml-1"
          />
        </label>
        <label htmlFor="advance-speed-setting">
        Advance Speed
          <input
            id="advance-speed-setting"
            type="range"
            min="0"
            max="12000"
            step="200"
            value={advanceSpeed}
            onChange={(event) => comms.setAdvanceSpeed(parseInt(event.target.value, 10))}
            className="ml-1"
          />
        </label>
      </p>

      <h3>Camera</h3>
      <p>
        <label htmlFor="contrast-setting" className="mr-2">
          Contrast
          <input
            id="contrast-setting"
            type="range"
            min="-100"
            max="100"
            step="1"
            value={contrast}
            onChange={(event) => comms.setContrast(parseInt(event.target.value, 10))}
            className="ml-1"
          />
        </label>
        <label htmlFor="saturation-setting" className="mr-2">
          Saturation
          <input
            id="saturation-setting"
            type="range"
            min="-100"
            max="100"
            step="1"
            value={saturation}
            onChange={(event) => comms.setSaturation(parseInt(event.target.value, 10))}
            className="ml-1"
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
            className="ml-1"
          />
        </label>
      </p>
    </React.Fragment>
  );
}

export default Controls;
