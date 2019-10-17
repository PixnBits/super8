import React from 'react';

import useCommsConnectedState from './hooks/useCommsConnected';

function Controls() {
  const [commsConnected] = useCommsConnectedState();

  return (
    <nav className="navbar navbar-expand-lg navbar-dark bg-dark">
      <div className="navbar-brand">
        {commsConnected ? (
          <span title="Connected!">🖧</span>
        ) : (
          <span title="Disconnected">{'\u274C'}</span>
        )}
        {' '}
        Super 8 Projector Control
      </div>
    </nav>
  );
}

export default Controls;
