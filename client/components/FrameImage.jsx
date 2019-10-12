import React, { useState, useEffect } from 'react';

import comms from '../comms';

function FrameImage() {
  // view --> reset --> view
  const [showFrame, setShowFrame] = useState(true);
  useEffect(() => {
    const listener = () => {
      console.log('frame notification');
      // showFrame := true we need to cycle false then later back to true
      // showFrame := false already in process so noop
      if (showFrame === false) {
        return;
      }
      setShowFrame(false);
      setTimeout(() => setShowFrame(true), 200);
    };
    comms.addEventListener('frame', listener);
    return () => comms.removeEventListener('frame', listener);
  });
  return (
    <p>
      <img className="img-fluid" src={showFrame ? '/frame.jpg' : ''} />
    </p>
  );
}

export default FrameImage;
