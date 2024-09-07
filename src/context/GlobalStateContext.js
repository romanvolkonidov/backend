import React, { createContext, useState, useEffect } from 'react';
import { collection, getDocs, addDoc, updateDoc, doc, getDoc, deleteDoc, setDoc } from 'firebase/firestore';
import { db } from '../firebase';

const GlobalStateContext = createContext();

const GlobalStateProvider = ({ children }) => {
  const [transactions, setTransactions] = useState([]);
  const [students, setStudents] = useState([]);
  const [expectedIncome, setExpectedIncome] = useState(1000); // Default expected income
  const [exchangeRates, setExchangeRates] = useState({});
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

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
    } catch (error) {
      setError("Error fetching data");
      console.error("Error fetching data: ", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchExchangeRates = async () => {
    setLoading(true);
    setError(null);
    try {
      const lastFetchTime = localStorage.getItem('lastFetchTime');
      const now = new Date();
      if (!lastFetchTime || (now - new Date(lastFetchTime)) > 24 * 60 * 60 * 1000) {
        const response = await fetch('https://v6.exchangerate-api.com/v6/3bbdd0fd4d206d7fbbf81174/latest/USD');
        const data = await response.json();
        const relevantRates = {
          USD: data.conversion_rates.USD,
          EUR: data.conversion_rates.EUR,
          KES: data.conversion_rates.KES,
          RUB: data.conversion_rates.RUB,
        };
        setExchangeRates(relevantRates);
        localStorage.setItem('lastFetchTime', new Date().toISOString());
      }
    } catch (error) {
      setError("Error fetching exchange rates");
      console.error("Error fetching exchange rates: ", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    fetchExchangeRates();
  }, []);

  const addTransaction = async (transaction) => {
    setLoading(true);
    setError(null);
    try {
      const newTransaction = {
        ...transaction,
        date: new Date().toISOString(), // Store the date of the transaction
      };
      const docRef = await addDoc(collection(db, 'transactions'), newTransaction);
      setTransactions(prev => [...prev, { id: docRef.id, ...newTransaction }]);
    } catch (error) {
      setError("Error adding transaction");
      console.error("Error adding document: ", error);
    } finally {
      setLoading(false);
    }
  };

  const addStudent = async (student) => {
    setLoading(true);
    setError(null);
    try {
      const docRef = await addDoc(collection(db, 'students'), student);
      setStudents(prev => [...prev, { id: docRef.id, ...student }]);
    } catch (error) {
      setError("Error adding student");
      console.error("Error adding document: ", error);
    } finally {
      setLoading(false);
    }
  };

  const updateStudent = async (id, updatedStudent) => {
    setLoading(true);
    setError(null);
    try {
      const studentDoc = doc(db, 'students', id);
      await updateDoc(studentDoc, updatedStudent);
      setStudents(prev => prev.map(student => (student.id === id ? { id, ...updatedStudent } : student)));
    } catch (error) {
      setError("Error updating student");
      console.error("Error updating document: ", error);
    } finally {
      setLoading(false);
    }
  };

  const deleteStudent = async (id) => {
    setLoading(true);
    setError(null);
    try {
      await deleteDoc(doc(db, 'students', id));
      setStudents(prev => prev.filter(student => student.id !== id));
    } catch (error) {
      setError("Error deleting student");
      console.error("Error deleting document: ", error);
    } finally {
      setLoading(false);
    }
  };

  const updateExpectedIncome = async (income) => {
    setLoading(true);
    setError(null);
    try {
      const docRef = doc(db, 'settings', 'expectedIncome');
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        await updateDoc(docRef, { value: income });
      } else {
        await setDoc(docRef, { value: income });
      }

      setExpectedIncome(income); // Update the state immediately
    } catch (error) {
      setError("Error updating expected income");
      console.error("Error updating document: ", error);
    } finally {
      setLoading(false);
    }
  };

  const deleteTransaction = async (id) => {
    setLoading(true);
    setError(null);
    try {
      await deleteDoc(doc(db, 'transactions', id));
      setTransactions(prev => prev.filter(transaction => transaction.id !== id));
    } catch (error) {
      setError("Error deleting transaction");
      console.error("Error deleting document: ", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <GlobalStateContext.Provider value={{
      transactions,
      students,
      expectedIncome,
      addTransaction,
      addStudent,
      updateStudent,
      deleteStudent,
      updateExpectedIncome,
      deleteTransaction,
      setTransactions,
      setStudents,
      exchangeRates,
      error,
      loading
    }}>
      {children}
    </GlobalStateContext.Provider>
  );
};

export { GlobalStateContext, GlobalStateProvider };
