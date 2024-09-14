import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './components/Home';
import MonthlyReport from './components/MonthlyReport';
import StudentManagement from './components/StudentManagement';
import StudentPage from './components/StudentPage';
import EventsPage from './components/EventsPage';
import Navbar from './components/Navbar';
import { GlobalStateProvider } from './context/GlobalStateContext';
import SVGInvoiceGenerator from './components/SVGInvoiceGenerator';
import StudentDashboard from './components/StudentDashboard';
import './styles/App.css';

function App() {
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('/service-worker.js')
          .then(registration => {
            console.log('ServiceWorker registration successful with scope: ', registration.scope);
          }, error => {
            console.log('ServiceWorker registration failed: ', error);
          });
      });
    }

    let deferredPrompt;
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      deferredPrompt = e;

      const installButton = document.getElementById('install-button');
      installButton.style.display = 'block';

      installButton.addEventListener('click', () => {
        installButton.style.display = 'none';
        deferredPrompt.prompt();
        deferredPrompt.userChoice.then((choiceResult) => {
          if (choiceResult.outcome === 'accepted') {
            console.log('User accepted the install prompt');
          } else {
            console.log('User dismissed the install prompt');
          }
          deferredPrompt = null;
        });
      });
    });
  }, []);

  return (
    <GlobalStateProvider>
      <Router>
        <Navbar />
        <div className="app">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/monthly-report" element={<MonthlyReport />} />
            <Route path="/students" element={<StudentManagement />} />
            <Route path="/student/:id" element={<StudentPage />} />
            <Route path="/student-dashboard/:id" element={<StudentDashboard />} />
            <Route path="/student-events" element={<EventsPage />} />
            <Route path="/invoice-generator" element={<SVGInvoiceGenerator />} />
          </Routes>
          <button id="install-button" className="hidden">Install</button>
        </div>
      </Router>
    </GlobalStateProvider>
  );
}

export default App;