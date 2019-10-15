import React, { useState, useEffect } from 'react';

import comms from '../comms';

function FrameImage() {
  const [imgSrc, setImgSrc] = useState(0);
  useEffect(() => {
    const listener = () => {
      // NOTE: this doesn't account for multiple instances of the component
      // (if >1 component they may use different URLs, loading the same data
      // multiple times)
      const newSrc = `/frame.jpg?t=${Date.now()}`;
      setImgSrc(newSrc);
    };
    comms.addEventListener('frame', listener);
    return () => comms.removeEventListener('frame', listener);
  });
  return (
    <p>
      <img className="img-fluid" src={imgSrc} />
    </p>
  );
}

export default FrameImage;
