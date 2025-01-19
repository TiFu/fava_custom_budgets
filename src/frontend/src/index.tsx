import App from './App'
import * as ReactDOM from "react-dom";
import * as React from 'react';

const root = (ReactDOM as any).createRoot(document.getElementById("root") as HTMLElement);
root.render(
  <React.StrictMode>
      <App />
  </React.StrictMode>
);