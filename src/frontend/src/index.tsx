import App from './App'
import * as ReactDOM from "react-dom";
import * as React from 'react';
import { createRoot } from 'react-dom/client';
import { Provider } from 'react-redux';
import store from './store/index'


const root = createRoot(document.getElementById("root") as HTMLElement);
root.render(
  <React.StrictMode>
      <Provider store={store}>
      <App />
      </Provider>
  </React.StrictMode>
);