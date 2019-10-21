import React, { useState } from 'react';

import useCommsNotificationValue from './hooks/useCommsNotificationValue';

function friendlyRound(number, places = 1) {
  const movement = 10 ** places;
  return Math.round(number * movement) / movement;
}

function Notifications() {
  const [allNotifications, setNotifications] = useState({});
  // projector
  useCommsNotificationValue(
    'captureStats',
    ({ stats: { frameCount, started, now } }) => {
      const secondsElapsed = Math.round((now - started) / 1e3);
      // allNotifications reference here is only the first value
      // TODO: refactor this clumbsy approach (in every usage)
      allNotifications.captureStats = `${frameCount} frames in ${secondsElapsed}s, or ${friendlyRound(frameCount / secondsElapsed)} fps (${friendlyRound(secondsElapsed / frameCount)} spf)`;
      setNotifications({ ...allNotifications });
    },
    null
  );

  useCommsNotificationValue(
    'fileWritten',
    ({ filePath }) => {
      allNotifications.fileWritten = `wrote ${filePath}`;
      setNotifications({ ...allNotifications });
    },
    null
  );

  return (
    <React.Fragment>
      <h3>Notifications</h3>
      <pre>{Object.values(allNotifications).join('\n')}</pre>
    </React.Fragment>
  );
}

export default Notifications;
