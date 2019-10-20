import React, { useState, useEffect } from 'react';

import comms from '../comms';
import useCommsNotificationValue from './hooks/useCommsNotificationValue';
import useClientRect from './hooks/useClientRect';

function frameNotification(notification) {
  // NOTE: this doesn't account for multiple instances of the component
  // (if >1 component they may use different URLs, loading the same data
  // multiple times)
  const imgSrc = `/frame.jpg?t=${Date.now()}`;
  if (!notification) {
    return {
      imgSrc,
      imgSize: { width: 800, height: 600 },
    };
  }
  const { frame } = notification;
  const { /* encoding, */ size: { width, height } } = frame;
  return {
    imgSrc,
    imgSize: { width, height },
  };
}

const padding = 20;

function FrameImage() {
  const [svgRect, svgRef] = useClientRect(true);
  const [{ imgSrc, imgSize }] = useCommsNotificationValue('frame', frameNotification, frameNotification);
  const [cropDims, setCropDims] = useState({
    x1: 0, y1: 0, x2: imgSize.width, y2: imgSize.height,
  });
  const cropXLeft = padding + cropDims.x1;
  const cropXRight = padding + cropDims.x2;
  const cropYTop = padding + cropDims.y1;
  const cropYBottom = padding + cropDims.y2;

  const [cropMovementModes, setCropMovementModes] = useState(null);

  function finishCropMovement() {
    if (!cropMovementModes) {
      return;
    }

    setCropMovementModes(null);

    const xMin = Math.min(cropDims.x1, cropDims.x2);
    const xMax = Math.max(cropDims.x1, cropDims.x2);
    const yMin = Math.min(cropDims.y1, cropDims.y2);
    const yMax = Math.max(cropDims.y1, cropDims.y2);
    comms.setCropWindow({
      left: xMin,
      top: yMin,
      width: xMax - xMin,
      height: yMax - yMin,
    });
  }
  function startCropMovement(modes) {
    if (cropMovementModes) {
      finishCropMovement();
    }
    setCropMovementModes(modes);
  }

  useEffect(() => {
    const cropWindowCallback = (event) => {
      const { notification } = event;
      const {
        cropWindow: {
          left,
          top,
          width,
          height,
        },
      } = notification;
      // stop any current operation
      setCropMovementModes(null);
      // set the new dims
      setCropDims({
        x1: left,
        y1: top,
        x2: left + width,
        y2: top + height,
      });
    };
    comms.addEventListener('cameraCropWindow', cropWindowCallback);
    return () => comms.removeEventListener('cameraCropWindow', cropWindowCallback);
  }, comms);

  return (
    <p>
      <svg
        version="1.1"
        xmlns="http://www.w3.org/2000/svg"
        width={imgSize.width + 2 * padding}
        height={imgSize.height + 2 * padding}
        onMouseMove={(event) => {
          if (!cropMovementModes) {
            return;
          }

          const x = event.pageX - padding - svgRect.x;
          const y = event.pageY - padding - svgRect.y;

          const xClamped = Math.max(Math.min(x, imgSize.width), 0);
          const yClamped = Math.max(Math.min(y, imgSize.height), 0);

          const newCropDims = { ...cropDims };
          cropMovementModes.forEach((mode) => {
            switch (mode) {
              case 'top':
                newCropDims.y1 = yClamped;
                return;
              case 'right':
                newCropDims.x2 = xClamped;
                return;
              case 'bottom':
                newCropDims.y2 = yClamped;
                return;
              case 'left':
                newCropDims.x1 = xClamped;
                return;
              default:
                throw new Error(`unknown mode "${mode}"`);
            }
          });
          setCropDims(newCropDims);
        }}
        onMouseUp={finishCropMovement}
        onMouseLeave={finishCropMovement}
        ref={svgRef}
      >
        <image href={imgSrc} x={padding} y={padding} height={`${imgSize.height}px`} width={`${imgSize.width}px`} />

        <line stroke="red" strokeWidth="5" x1={cropXLeft} x2={cropXRight} y1={cropYTop} y2={cropYTop} onMouseDown={() => startCropMovement(['top'])} />
        <line stroke="red" strokeWidth="5" x1={cropXLeft} x2={cropXRight} y1={cropYBottom} y2={cropYBottom} onMouseDown={() => startCropMovement(['bottom'])} />
        <line stroke="red" strokeWidth="5" x1={cropXLeft} x2={cropXLeft} y1={cropYTop} y2={cropYBottom} onMouseDown={() => startCropMovement(['left'])} />
        <line stroke="red" strokeWidth="5" x1={cropXRight} x2={cropXRight} y1={cropYTop} y2={cropYBottom} onMouseDown={() => startCropMovement(['right'])} />

        <circle r="5" fill="red" cx={cropXLeft} cy={cropYTop} onMouseDown={() => startCropMovement(['top', 'left'])} />
        <circle r="5" fill="red" cx={cropXLeft} cy={cropYBottom} onMouseDown={() => startCropMovement(['bottom', 'left'])} />
        <circle r="5" fill="red" cx={cropXRight} cy={cropYTop} onMouseDown={() => startCropMovement(['top', 'right'])} />
        <circle r="5" fill="red" cx={cropXRight} cy={cropYBottom} onMouseDown={() => startCropMovement(['bottom', 'right'])} />
      </svg>
      {`(${Math.min(cropDims.x1, cropDims.x2)}, ${Math.min(cropDims.y1, cropDims.y2)}) to (${Math.max(cropDims.x1, cropDims.x2)}, ${Math.max(cropDims.y1, cropDims.y2)})`}
    </p>
  );
}

export default FrameImage;
