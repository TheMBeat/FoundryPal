import React from 'react';
import ReactDOM from 'react-dom/client';
import { CompanionApp } from './App.js';
import { BrowserWebSocketTransport } from './bridge/websocket-transport.js';
import './styles/app.css';

const wsUrl = (import.meta as any).env?.VITE_BRIDGE_WS_URL ?? 'ws://localhost:3001/bridge';
const transport = new BrowserWebSocketTransport(wsUrl);

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <CompanionApp transport={transport} />
  </React.StrictMode>,
);
