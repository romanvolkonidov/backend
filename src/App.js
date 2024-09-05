import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './components/Home';
import MonthlyReport from './components/MonthlyReport';
import StudentManagement from './components/StudentManagement';
import StudentPage from './components/StudentPage';
import Navbar from './components/Navbar';
import { GlobalStateProvider } from './context/GlobalStateContext';

function App() {
  return (
    <GlobalStateProvider>
      <Router>
        <Navbar />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/monthly-report" element={<MonthlyReport />} />
          <Route path="/students" element={<StudentManagement />} />
          <Route path="/student/:id" element={<StudentPage />} />
        </Routes>
      </Router>
    </GlobalStateProvider>
  );
}

export default App;
