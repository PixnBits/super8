import React from 'react';

const App = () => (
  <>
    <header>
      <div className="navbar navbar-dark bg-dark shadow-sm">
        <div className="container d-flex justify-content-between">
          <strong className="navbar-brand">Super 8 Projector Control</strong>
        </div>
      </div>
    </header>
    <main>
      <p>Appy!</p>
      <p>
        video preview
        <img src="/frame.jpg" />
      </p>
      <p>Controls (Advance Frame, Advance, Stop)</p>
    </main>
  </>
);

export default App;
