import { useState, useEffect } from 'react';

import comms from '../../comms';

export default function useCommsNotificationValue(
  eventName,
  valueName,
  defaultState
) {
  const [notificationValue, setNotificationValue] = useState(defaultState);
  useEffect(() => {
    const eventListener = (event) => {
      const { notification } = event;
      setNotificationValue(notification[valueName]);
    };
    comms.addEventListener(eventName, eventListener);
    return () => {
      comms.removeEventListener(eventName, eventListener);
    };
  });

  return [notificationValue];
}
