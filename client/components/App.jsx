import React from 'react';

import Header from './Header';
import Controls from './Controls';
import Notifications from './Notifications';
import FrameImage from './FrameImage';

const App = () => (
  <React.Fragment>
    <header>
      <Header />
    </header>
    <main>
      <Controls />
      <Notifications />
      <FrameImage />
    </main>
  </React.Fragment>
);

export default App;
