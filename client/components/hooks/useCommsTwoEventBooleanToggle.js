import { useState, useEffect } from 'react';

import comms from '../../comms';

export default function useCommsTwoEventBooleanToggle(
  trueEventName,
  falseEventName,
  defaultState = true
) {
  const [booleanState, setBooleanState] = useState(defaultState);
  useEffect(() => {
    const trueEventListener = () => setBooleanState(true);
    const falseEventListener = () => setBooleanState(false);
    comms.addEventListener(trueEventName, trueEventListener);
    comms.addEventListener(falseEventName, falseEventListener);
    return () => {
      comms.removeEventListener(trueEventName, trueEventListener);
      comms.removeEventListener(falseEventName, falseEventListener);
    };
  });

  return [booleanState];
}
