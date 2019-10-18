import React from 'react';

import useCommsNotificationValue from './hooks/useCommsNotificationValue';

// NOTE: this doesn't account for multiple instances of the component
// (if >1 component they may use different URLs, loading the same data
// multiple times)
function getNewFrameSrc() {
  return `/frame.jpg?t=${Date.now()}`;
}

function FrameImage() {
  const [imgSrc] = useCommsNotificationValue('frame', getNewFrameSrc, getNewFrameSrc);
  return (
    <p>
      <img className="img-fluid" src={imgSrc} alt="The Super 8 film as seen by the camera" />
    </p>
  );
}

export default FrameImage;
