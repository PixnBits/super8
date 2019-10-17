import React from 'react';

import Header from './Header';
import Controls from './Controls';
import FrameImage from './FrameImage';

const App = () => (
  <React.Fragment>
    <header>
      <Header />
    </header>
    <main>
      <Controls />
      <FrameImage />
    </main>
  </React.Fragment>
);

export default App;
