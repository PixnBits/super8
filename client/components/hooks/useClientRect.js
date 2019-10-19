// https://reactjs.org/docs/hooks-faq.html#how-can-i-measure-a-dom-node
import { useState, useCallback } from 'react';

export default function useClientRect(absolute = false) {
  const [rect, setRect] = useState(null);
  const ref = useCallback((node) => {
    if (!node) {
      return;
    }

    const domRect = node.getBoundingClientRect();
    if (!absolute) {
      setRect({ ...domRect });
      return;
    }
    // absolute means the scrolling needs to be taken into account
    const { scrollX, scrollY } = window;
    setRect({
      ...domRect, // width and height
      x: domRect.x + scrollX,
      y: domRect.y + scrollY,
      top: domRect.top + scrollY,
      left: domRect.left + scrollX,
      bottom: domRect.bottom + scrollY,
      right: domRect.right + scrollX,
    });
  }, []);
  return [rect, ref];
}
