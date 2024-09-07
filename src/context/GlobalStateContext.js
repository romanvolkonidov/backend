import React, { createContext, useState, useEffect } from 'react';
import { collection, getDocs, addDoc, updateDoc, doc, getDoc, deleteDoc, setDoc } from 'firebase/firestore';
import { db } from '../firebase';

const GlobalStateContext = createContext();

const GlobalStateProvider = ({ children }) => {
  const [transactions, setTransactions] = useState([]);
  const [students, setStudents] = useState([]);
  const [expectedIncome, setExpectedIncome] = useState(1000);
  const [exchangeRates, setExchangeRates] = useState({});
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchExchangeRates = async () => {
    try {
      const response = await fetch('https://v6.exchangerate-api.com/v6/3bbdd0fd4d206d7fbbf81174/latest/USD');
      const data = await response.json();
      const relevantRates = {
        USD: data.conversion_rates.USD,
        EUR: data.conversion_rates.EUR,
        KES: data.conversion_rates.KES,
        RUB: data.conversion_rates.RUB,
      };
      setExchangeRates(relevantRates);
      // Store rates and timestamp in localStorage
      localStorage.setItem('exchangeRates', JSON.stringify({ rates: relevantRates, timestamp: Date.now() }));
    } catch (error) {
      setError("Error fetching exchange rates");
      console.error("Error fetching exchange rates: ", error);
    }
  };

  const loadExchangeRates = () => {
    const storedData = localStorage.getItem('exchangeRates');
    if (storedData) {
      const { rates, timestamp } = JSON.parse(storedData);
      const now = Date.now();
      // Check if the stored data is less than 24 hours old
      if (now - timestamp < 24 * 60 * 60 * 1000) {
        setExchangeRates(rates);
      } else {
        fetchExchangeRates(); // Fetch new rates if older than 24 hours
      }
    } else {
      fetchExchangeRates(); // Fetch if no stored data
    }
  };

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      // Fetch transactions
      const transactionSnapshot = await getDocs(collection(db, 'transactions'));
      const fetchedTransactions = transactionSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setTransactions(fetchedTransactions);

      // Fetch students
      const studentSnapshot = await getDocs(collection(db, 'students'));
      const fetchedStudents = studentSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setStudents(fetchedStudents);

      // Fetch expected income
      const incomeDocRef = doc(db, 'settings', 'expectedIncome');
      const incomeDocSnap = await getDoc(incomeDocRef);
      if (incomeDocSnap.exists()) {
        const incomeValue = incomeDocSnap.data().value;
        setExpectedIncome(incomeValue);
      }

      // Load exchange rates
      loadExchangeRates();
    } catch (error) {
      setError("Error fetching data");
      console.error("Error fetching data: ", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // ... (rest of your code for adding, updating, and deleting transactions/students)

  return (
    <GlobalStateContext.Provider value={{
      transactions,
      students,
      expectedIncome,
      exchangeRates,
      error,
      loading,
      // ... (other functions)
    }}>
      {children}
    </GlobalStateContext.Provider>
  );
};

export { GlobalStateContext, GlobalStateProvider };
