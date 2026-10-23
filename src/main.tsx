import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { registerSW } from 'virtual:pwa-register';

// Register PWA service worker for full offline functionality
registerSW({
  immediate: true,
  onNeedRefresh() {
    console.log('PWA: New version available, updated.');
  },
  onOfflineReady() {
    console.log('PWA: App is ready for offline play.');
  },
});

createRoot(document.getElementById('root')!).render(<App />);
