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

  const disableAllControls = !commsConnected;

  function rewind() {
    // not damaging archival material is really important, stopping the world is appropriate IMO
    if (window.confirm(
      'WARNING: Reversing while the film is in the gate can damage the film!\nEnsure the film is out of the gate.'
    )) {
      comms.rewind();
    }
  }

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
        <button type="button" className="btn btn-danger" disabled={disableAllControls || isProjectorBusy} onClick={rewind}>Rewind</button>
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
    </React.Fragment>
  );
}

export default Controls;
