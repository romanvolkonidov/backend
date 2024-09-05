import React, { createContext, useState, useEffect } from 'react';
import { collection, getDocs, addDoc, updateDoc, doc, getDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../firebase';

const GlobalStateContext = createContext();

const GlobalStateProvider = ({ children }) => {
  const [transactions, setTransactions] = useState([]);
  const [students, setStudents] = useState([]);
  const [expectedIncome, setExpectedIncome] = useState(1000); // Default expected income
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        // Fetch transactions
        const transactionSnapshot = await getDocs(collection(db, 'transactions'));
        const fetchedTransactions = transactionSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setTransactions(fetchedTransactions);

        // Fetch expected income
        const incomeDocRef = doc(db, 'settings', 'expectedIncome');
        const incomeDocSnap = await getDoc(incomeDocRef);
        if (incomeDocSnap.exists()) {
          setExpectedIncome(incomeDocSnap.data().value);
        }
      } catch (error) {
        setError("Error fetching data");
        console.error("Error fetching Firestore data: ", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
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

  const updateExpectedIncome = async (income) => {
    setLoading(true);
    setError(null);
    try {
      const docRef = doc(db, 'settings', 'expectedIncome');
      await updateDoc(docRef, { value: income });
      setExpectedIncome(income);
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
    <GlobalStateContext.Provider value={{ transactions, students, expectedIncome, addTransaction, updateExpectedIncome, deleteTransaction, setTransactions, setStudents, error, loading }}>
      {children}
    </GlobalStateContext.Provider>
  );
};

export { GlobalStateContext, GlobalStateProvider };
