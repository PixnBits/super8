import { useState, useEffect } from 'react';

import comms from '../../comms';

export default function useCommsNotificationValue(
  eventName,
  valueNameOrCallback,
  initialState
) {
  const [notificationValue, setNotificationValue] = useState(initialState);

  useEffect(() => {
    const notificationCallback = typeof valueNameOrCallback === 'function' ? (
      valueNameOrCallback
    ) : (
      (notification) => notification[valueNameOrCallback]
    );

    const eventListener = (event) => {
      const { notification } = event;
      setNotificationValue(notificationCallback(notification));
    };
    comms.addEventListener(eventName, eventListener);
    return () => comms.removeEventListener(eventName, eventListener);
  });

  return [notificationValue];
}
