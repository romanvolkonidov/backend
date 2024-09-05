import React, { useState, useMemo, useContext, useEffect } from 'react';
import { GlobalStateContext } from '../context/GlobalStateContext';
import '../styles/MonthlyReport.css';
import { db } from '../firebase'; // Adjust the import path as necessary
import { collection, getDocs } from 'firebase/firestore';

const MonthlyReport = () => {
  const { transactions, setTransactions, students } = useContext(GlobalStateContext);
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7));
  const [filterType, setFilterType] = useState('all');
  const [filterCategory, setFilterCategory] = useState('');
  const [loading, setLoading] = useState(true);
  const [firestoreData, setFirestoreData] = useState([]);
  const [editingTransactionId, setEditingTransactionId] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, 'yourCollection')); // Replace 'yourCollection' with your actual collection name
        const items = querySnapshot.docs.map(doc => doc.data());
        setFirestoreData(items);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching Firestore data: ", error);
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const filteredTransactions = useMemo(() => {
    return transactions.filter(t => {
      const matchesMonth = t.date && t.date.startsWith(selectedMonth);
      const matchesType = filterType === 'all' || t.type === filterType;
      const matchesCategory = filterCategory ? t.category === filterCategory : true;
      const isNotLesson = t.type !== 'lesson'; // Exclude lessons
      return matchesMonth && matchesType && matchesCategory && isNotLesson;
    });
  }, [transactions, selectedMonth, filterType, filterCategory]);

  const totalIncome = useMemo(() => {
    return filteredTransactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + (typeof t.amount === 'number' ? t.amount : 0), 0);
  }, [filteredTransactions]);

  const totalExpenses = useMemo(() => {
    return filteredTransactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + (typeof t.amount === 'number' ? t.amount : 0), 0);
  }, [filteredTransactions]);

  const handleRemoveTransaction = (id) => {
    const updatedTransactions = transactions.filter(transaction => transaction.id !== id);
    localStorage.setItem('transactions', JSON.stringify(updatedTransactions));
    setTransactions(updatedTransactions);
  };

  const handleEditTransaction = (updatedTransaction) => {
    try {
      const updatedTransactions = transactions.map(transaction => 
        transaction.id === updatedTransaction.id ? updatedTransaction : transaction
      );
      localStorage.setItem('transactions', JSON.stringify(updatedTransactions));
      setTransactions(updatedTransactions);
      setEditingTransactionId(null); // Exit editing mode
    } catch (error) {
      console.error("Error editing transaction: ", error);
    }
  };

  const startEditing = (id) => {
    setEditingTransactionId(id);
  };

  const cancelEditing = () => {
    setEditingTransactionId(null);
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="monthly-report">
      <h2>Monthly Report</h2>
      <div>
        <label htmlFor="month">Month:</label>
        <input
          type="month"
          id="month"
          value={selectedMonth}
          onChange={(e) => setSelectedMonth(e.target.value)}
        />
      </div>
      <div>
        <label htmlFor="filterType">Filter by Type:</label>
        <select
          id="filterType"
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
        >
          <option value="all">All</option>
          <option value="income">Income</option>
          <option value="expense">Expense</option>
        </select>
      </div>
      <div>
        <label htmlFor="filterCategory">Filter by Category:</label>
        <select
          id="filterCategory"
          value={filterCategory}
          onChange={(e) => setFilterCategory(e.target.value)}
        >
          <option value="">All</option>
          {students.map(student => (
            <option key={student.name} value={student.name}>{student.name}</option>
          ))}
        </select>
      </div>
      <div>
        <h3>Total Income: {totalIncome.toFixed(2)} KSH</h3>
        <h3>Total Expenses: {totalExpenses.toFixed(2)} KSH</h3>
      </div>
      <div>
        <h3>Income</h3>
        <ul className="transaction-list">
          {filteredTransactions.filter(t => t.type === 'income').map(transaction => (
            <li key={transaction.id} className="transaction-item">
              {editingTransactionId === transaction.id ? (
                <>
                  <input
                    type="number"
                    defaultValue={transaction.amount}
                    onBlur={(e) => handleEditTransaction({
                      ...transaction,
                      amount: parseFloat(e.target.value)
                    })}
                  />
                  <input
                    type="date"
                    defaultValue={transaction.date.split('T')[0]} // Adjusted to match date format
                    onBlur={(e) => handleEditTransaction({
                      ...transaction,
                      date: e.target.value
                    })}
                  />
                  <input
                    type="text"
                    defaultValue={transaction.category}
                    onBlur={(e) => handleEditTransaction({
                      ...transaction,
                      category: e.target.value
                    })}
                  />
                  <input
                    type="text"
                    defaultValue={transaction.subject}
                    onBlur={(e) => handleEditTransaction({
                      ...transaction,
                      subject: e.target.value
                    })}
                  />
                  <button onClick={cancelEditing}>Cancel</button>
                </>
              ) : (
                <>
                  <span>
                    {transaction.category}: {typeof transaction.amount === 'number' ? transaction.amount.toFixed(2) : transaction.amount} KSH - {transaction.date.split('T')[0]}
                  </span>
                  <div className="button-group">
                    <button onClick={() => handleRemoveTransaction(transaction.id)} title="Remove this transaction">Remove</button>
                    <button onClick={() => startEditing(transaction.id)} title="Edit this transaction">Edit</button>
                  </div>
                </>
              )}
            </li>
          ))}
        </ul>
      </div>
      <div>
        <h3>Expenses</h3>
        <ul className="transaction-list">
          {filteredTransactions.filter(t => t.type === 'expense').map(transaction => (
            <li key={transaction.id} className="transaction-item">
              {editingTransactionId === transaction.id ? (
                <>
                  <input
                    type="number"
                    defaultValue={transaction.amount}
                    onBlur={(e) => handleEditTransaction({
                      ...transaction,
                      amount: parseFloat(e.target.value)
                    })}
                  />
                  <input
                    type="date"
                    defaultValue={transaction.date.split('T')[0]} // Adjusted to match date format
                    onBlur={(e) => handleEditTransaction({
                      ...transaction,
                      date: e.target.value
                    })}
                  />
                  <input
                    type="text"
                    defaultValue={transaction.category}
                    onBlur={(e) => handleEditTransaction({
                      ...transaction,
                      category: e.target.value
                    })}
                  />
                  <input
                    type="text"
                    defaultValue={transaction.subject}
                    onBlur={(e) => handleEditTransaction({
                      ...transaction,
                      subject: e.target.value
                    })}
                  />
                  <button onClick={cancelEditing}>Cancel</button>
                </>
              ) : (
                <>
                  <span>
                    {transaction.category}: {typeof transaction.amount === 'number' ? transaction.amount.toFixed(2) : transaction.amount} KSH - {transaction.date.split('T')[0]}
                  </span>
                  <div className="button-group">
                    <button onClick={() => handleRemoveTransaction(transaction.id)} title="Remove this transaction">Remove</button>
                    <button onClick={() => startEditing(transaction.id)} title="Edit this transaction">Edit</button>
                  </div>
                </>
              )}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default MonthlyReport;