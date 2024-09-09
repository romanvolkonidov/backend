import React, { useState, useMemo, useContext, useEffect } from 'react';
import { GlobalStateContext } from '../context/GlobalStateContext';
import { db } from '../firebase'; // Import your Firebase configuration
import { collection, addDoc, deleteDoc, doc, updateDoc } from 'firebase/firestore'; // Import Firestore functions
import '../styles/MonthlyReport.css';

const currencies = ['USD', 'KES', 'RUB'];
const expenseCategories = ['Rent', 'Utilities', 'Groceries', 'Clothing', 'Transportation', 'Healthcare', 'Personal Care', 'Household Items', 'Friends', 'Entertainment', 'Online Subscriptions', 'Savings']; // Define expense categories

const MonthlyReport = () => {
  const { transactions = [], students = [], exchangeRates = {}, setTransactions } = useContext(GlobalStateContext);
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7));
  const [filterType, setFilterType] = useState('all');
  const [filterCategory, setFilterCategory] = useState('');
  const [editingTransactionId, setEditingTransactionId] = useState(null);
  const [selectedCurrency, setSelectedCurrency] = useState('USD');
  const [error, setError] = useState(null);
  const [showPopup, setShowPopup] = useState(false);
  const [popupMessage, setPopupMessage] = useState('');

  const incomeCategories = useMemo(() => {
    const studentNames = students.map(student => student.name);
    return [...studentNames, 'Other'];
  }, [students]);

  const filteredTransactions = useMemo(() => {
    const filtered = transactions.filter(t => {
      const matchesMonth = t.date && t.date.startsWith(selectedMonth);
      const matchesType = filterType === 'all' || t.type === filterType;
      const matchesCategory = filterCategory ? (
        filterCategory === 'Other' ? 
          !incomeCategories.includes(t.category) : 
          t.category === filterCategory
      ) : true;
      const isNotLesson = t.type !== 'lesson';
      return matchesMonth && matchesType && matchesCategory && isNotLesson;
    });

    // Sort transactions by date and time in descending order
    return filtered.sort((a, b) => new Date(b.date) - new Date(a.date));
  }, [transactions, selectedMonth, filterType, filterCategory, incomeCategories]);

  const convertToSelectedCurrency = (amount, currency) => {
    if (!exchangeRates[currency] || !exchangeRates[selectedCurrency]) {
      console.error(`Missing exchange rate for ${currency} or ${selectedCurrency}`);
      return 0;
    }
    const rate = exchangeRates[selectedCurrency] / exchangeRates[currency];
    return amount * rate;
  };

  const totalIncome = useMemo(() => {
    return filteredTransactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + convertToSelectedCurrency(t.amount, t.currency || 'USD'), 0);
  }, [filteredTransactions, selectedCurrency, exchangeRates]);

  const totalExpenses = useMemo(() => {
    return filteredTransactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + convertToSelectedCurrency(t.amount, t.currency || 'USD'), 0);
  }, [filteredTransactions, selectedCurrency, exchangeRates]);

  useEffect(() => {
    console.log('Exchange Rates:', exchangeRates);
    console.log('Filtered Transactions:', filteredTransactions);
    console.log('Total Income:', totalIncome);
    console.log('Total Expenses:', totalExpenses);
  }, [exchangeRates, filteredTransactions, totalIncome, totalExpenses]);

  const handleRemoveTransaction = async (id) => {
    try {
      await deleteDoc(doc(db, 'transactions', id));
      setTransactions(transactions.filter(transaction => transaction.id !== id));
      setPopupMessage('Transaction removed successfully!');
      setShowPopup(true);
      setTimeout(() => setShowPopup(false), 3000); // Hide popup after 3 seconds
    } catch (error) {
      console.error("Error removing transaction: ", error);
    }
  };

  const handleEditTransaction = async (updatedTransaction) => {
    try {
      const transactionDoc = doc(db, 'transactions', updatedTransaction.id);
      await updateDoc(transactionDoc, updatedTransaction);
      const updatedTransactions = transactions.map(transaction => 
        transaction.id === updatedTransaction.id ? updatedTransaction : transaction
      );
      setTransactions(updatedTransactions);
      setEditingTransactionId(null);
      setPopupMessage('Transaction updated successfully!');
      setShowPopup(true);
      setTimeout(() => setShowPopup(false), 3000); // Hide popup after 3 seconds
    } catch (error) {
      console.error("Error editing transaction: ", error);
    }
  };

  const startEditing = (id) => {
    setEditingTransactionId(id);
  };

  const cancelEditing = () => {
    setEditingTransactionId(null);
    setPopupMessage('Editing cancelled!');
    setShowPopup(true);
    setTimeout(() => setShowPopup(false), 3000); // Hide popup after 3 seconds
  };

  return (
    <div className="monthly-report">
      <h2>Monthly Report</h2>
      {error && <p className="error-message">{error}</p>}
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
          {filterType === 'income' && incomeCategories.map(category => (
            <option key={category} value={category}>{category}</option>
          ))}
          {filterType === 'expense' && expenseCategories.map(category => (
            <option key={category} value={category}>{category}</option>
          ))}
        </select>
      </div>
      <div>
        <label htmlFor="currency">Currency:</label>
        <select
          id="currency"
          value={selectedCurrency}
          onChange={(e) => setSelectedCurrency(e.target.value)}
        >
          {currencies.map(curr => (
            <option key={curr} value={curr}>{curr}</option>
          ))}
        </select>
      </div>
      <div>
        <h3>Total Income: {totalIncome.toFixed(2)} {selectedCurrency}</h3>
        <h3>Total Expenses: {totalExpenses.toFixed(2)} {selectedCurrency}</h3>
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
                    defaultValue={transaction.date.split('T')[0]}
                    onBlur={(e) => handleEditTransaction({
                      ...transaction,
                      date: e.target.value
                    })}
                  />
                  <button onClick={cancelEditing}>Cancel</button>
                  <button onClick={() => handleEditTransaction(transaction)}>Update</button>
                </>
              ) : (
                <>
                  <span onClick={() => startEditing(transaction.id)}>
                    {transaction.category}: {typeof transaction.amount === 'number' ? transaction.amount.toFixed(2) : transaction.amount} {transaction.currency || 'USD'} - {transaction.date.split('T')[0]}
                  </span>
                  <div className="button-group">
                    <button onClick={() => handleRemoveTransaction(transaction.id)} title="Remove this transaction">Remove</button>
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
                    defaultValue={transaction.date.split('T')[0]}
                    onBlur={(e) => handleEditTransaction({
                      ...transaction,
                      date: e.target.value
                    })}
                  />
                  <button onClick={cancelEditing}>Cancel</button>
                  <button onClick={() => handleEditTransaction(transaction)}>Update</button>
                </>
              ) : (
                <>
                  <span onClick={() => startEditing(transaction.id)}>
                    {transaction.category}: {typeof transaction.amount === 'number' ? transaction.amount.toFixed(2) : transaction.amount} {transaction.currency || 'USD'} - {transaction.date.split('T')[0]}
                  </span>
                  <div className="button-group">
                    <button onClick={() => handleRemoveTransaction(transaction.id)} title="Remove this transaction">Remove</button>
                  </div>
                </>
              )}
            </li>
          ))}
        </ul>
      </div>

      {/* Submission Popup */}
      {showPopup && <div className="popup">{popupMessage}</div>}
    </div>
  );
};

export default MonthlyReport;
