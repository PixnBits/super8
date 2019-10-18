import React, { useState, useEffect } from 'react';

import comms from '../comms';

function getNewFrameSrc() {
  return `/frame.jpg?t=${Date.now()}`;
}

function FrameImage() {
  const [imgSrc, setImgSrc] = useState(getNewFrameSrc);
  useEffect(() => {
    const listener = () => {
      // NOTE: this doesn't account for multiple instances of the component
      // (if >1 component they may use different URLs, loading the same data
      // multiple times)
      setImgSrc(getNewFrameSrc());
    };
    comms.addEventListener('frame', listener);
    return () => comms.removeEventListener('frame', listener);
  });
  return (
    <p>
      <img className="img-fluid" src={imgSrc} alt="The Super 8 film as seen by the camera" />
    </p>
  );
}

export default FrameImage;
