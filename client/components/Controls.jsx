import React from 'react';

import comms from '../comms';
import useCommsConnectedState from './hooks/useCommsConnected';
import useCommsTwoEventBooleanToggle from './hooks/useCommsTwoEventBooleanToggle';
import useCommsNotificationValue from './hooks/useCommsNotificationValue';

function Controls() {
  const [commsConnected] = useCommsConnectedState();
  // projector
  const [isProjectorBusy] = useCommsTwoEventBooleanToggle('busy', 'idle', false);
  const [isLampOn] = useCommsTwoEventBooleanToggle('lampOn', 'lampOff', false);
  const [lampBrightness] = useCommsNotificationValue('lampBrightness', 'brightness', 25);
  const [advanceSpeed] = useCommsNotificationValue('advanceSpeed', 'speed', 3200);
  // camera
  const [cameraSettings] = useCommsNotificationValue('cameraSettings', 'settings', { contrast: 0, saturation: 0, brightness: 50 });

  const disableAllControls = !commsConnected;

  // TODO: debounce calls to comm.setContrast & setSaturation
  return (
    <React.Fragment>
      <h3>Projector</h3>
      <p>
        <button type="button" className="btn btn-primary mr-2" disabled={disableAllControls || isProjectorBusy} onClick={() => comms.captureAndAdvance()}>Capture and Advance</button>
        <button type="button" className="btn btn-danger mr-2" disabled={disableAllControls} onClick={() => comms.stop()}>Stop</button>
        <button type="button" className="btn btn-primary mr-2" disabled={disableAllControls || isProjectorBusy} onClick={() => comms.advanceFrame()}>Advance Frame</button>
        <button type="button" className="btn btn-primary mr-2" disabled={disableAllControls || isProjectorBusy} onClick={() => comms.captureFrame()}>Capture Frame</button>
        <button type="button" className="btn btn-secondary" disabled={disableAllControls || isProjectorBusy} onClick={() => comms.advance()}>Advance</button>
      </p>
      <p>
        Brightness
        <div className="btn-group ml-1 mr-1" role="group" aria-label="First group">
          <button type="button" className="btn btn-secondary" disabled={isLampOn} onClick={() => comms.lampOn()}>On</button>
          <button type="button" className="btn btn-secondary" disabled={!isLampOn} onClick={() => comms.lampOff()}>Off</button>
        </div>
        <input
          id="lamp-brightness-setting"
          type="range"
          min="0"
          max="255"
          step="1"
          disabled={disableAllControls}
          value={lampBrightness}
          onChange={(event) => comms.setLampBrightness(parseInt(event.target.value, 10))}
          className="mr-2"
        />

        <label htmlFor="advance-speed-setting">
        Advance Speed
          <input
            id="advance-speed-setting"
            type="range"
            min="0"
            max="12000"
            step="200"
            disabled={disableAllControls}
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
            disabled={disableAllControls}
            value={cameraSettings.contrast}
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
            disabled={disableAllControls}
            value={cameraSettings.saturation}
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
            disabled={disableAllControls}
            value={cameraSettings.cameraBrightness}
            onChange={(event) => comms.setCameraBrightness(parseInt(event.target.value, 10))}
            className="ml-1"
          />
        </label>
      </p>
    </React.Fragment>
  );
}

export default Controls;
