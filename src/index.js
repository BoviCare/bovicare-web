import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';

// Chrome often fires this during layout; it is harmless but CRA's dev overlay treats it as fatal.
const isBenignResizeObserverMessage = (message) =>
  typeof message === 'string' &&
  (message.includes('ResizeObserver loop completed with undelivered notifications') ||
    message.includes('ResizeObserver loop limit exceeded'));

window.addEventListener(
  'error',
  (event) => {
    if (isBenignResizeObserverMessage(event.message)) {
      event.stopImmediatePropagation();
    }
  },
  true
);

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
// reportWebVitals();
