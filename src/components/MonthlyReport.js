import React, { useState, useMemo, useContext, useEffect, useCallback } from 'react';
import { GlobalStateContext } from '../context/GlobalStateContext';
import { db } from '../firebase';
import { collection, addDoc, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import 'tailwindcss/tailwind.css';

const currencies = ['USD', 'KES', 'RUB'];
const expenseCategories = ['Rent', 'Utilities', 'Groceries', 'Clothing', 'Transportation', 'Healthcare', 'Personal Care', 'Household Items', 'Friends', 'Entertainment', 'Online Subscriptions', 'Savings'];

const MonthlyReport = () => {
  const { transactions = [], students = [], exchangeRates = {}, setTransactions, debt } = useContext(GlobalStateContext);
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7));
  const [filterType, setFilterType] = useState('all');
  const [filterCategory, setFilterCategory] = useState('');
  const [selectedDate, setSelectedDate] = useState('');
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
    return transactions.filter(t => {
      const matchesMonth = t.date && t.date.startsWith(selectedMonth);
      const matchesType = filterType === 'all' || t.type === filterType;
      const matchesCategory = filterCategory ? (
        filterCategory === 'Other' ? !incomeCategories.includes(t.category) : t.category === filterCategory
      ) : true;
      const matchesDate = selectedDate ? t.date.startsWith(selectedDate) : true;
      const isNotLesson = t.type !== 'lesson';
      return matchesMonth && matchesType && matchesCategory && matchesDate && isNotLesson;
    }).sort((a, b) => new Date(b.date) - new Date(a.date));
  }, [transactions, selectedMonth, filterType, filterCategory, selectedDate, incomeCategories]);

  const convertToSelectedCurrency = useCallback((amount, currency) => {
    if (!exchangeRates[currency] || !exchangeRates[selectedCurrency]) {
      console.error(`Missing exchange rate for ${currency} or ${selectedCurrency}`);
      return 0;
    }
    const rate = exchangeRates[selectedCurrency] / exchangeRates[currency];
    return amount * rate;
  }, [exchangeRates, selectedCurrency]);

  const totalIncome = useMemo(() => {
    return filteredTransactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + convertToSelectedCurrency(t.amount, t.currency), 0);
  }, [filteredTransactions, convertToSelectedCurrency]);

  const totalExpenses = useMemo(() => {
    return filteredTransactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + convertToSelectedCurrency(t.amount, t.currency), 0);
  }, [filteredTransactions, convertToSelectedCurrency]);

  const totalDebt = useMemo(() => {
    if (!debt || typeof debt.amount !== 'number' || !debt.currency) {
      console.error('Debt information is missing or incomplete:', debt);
      return 0;
    }
    return convertToSelectedCurrency(debt.amount, debt.currency);
  }, [debt, convertToSelectedCurrency]);

  useEffect(() => {
    console.log('Exchange Rates:', exchangeRates);
    console.log('Filtered Transactions:', filteredTransactions);
    console.log('Total Income:', totalIncome);
    console.log('Total Expenses:', totalExpenses);
    console.log('Total Debt:', totalDebt);
  }, [exchangeRates, filteredTransactions, totalIncome, totalExpenses, totalDebt]);

  const handleRemoveTransaction = useCallback(async (id) => {
    try {
      await deleteDoc(doc(db, 'transactions', id));
      setTransactions(prevTransactions => prevTransactions.filter(transaction => transaction.id !== id));
      setPopupMessage('Transaction removed successfully!');
      setShowPopup(true);
      setTimeout(() => setShowPopup(false), 3000);
    } catch (error) {
      console.error("Error removing transaction: ", error);
    }
  }, [setTransactions]);

  const handleEditTransaction = useCallback(async (updatedTransaction) => {
    try {
      const transactionDoc = doc(db, 'transactions', updatedTransaction.id);
      await updateDoc(transactionDoc, updatedTransaction);
      setTransactions(prevTransactions => prevTransactions.map(transaction =>
        transaction.id === updatedTransaction.id ? updatedTransaction : transaction
      ));
      setEditingTransactionId(null);
      setPopupMessage('Transaction updated successfully!');
      setShowPopup(true);
      setTimeout(() => setShowPopup(false), 3000);
    } catch (error) {
      console.error("Error editing transaction: ", error);
    }
  }, [setTransactions]);

  const startEditing = (id) => {
    setEditingTransactionId(id);
  };

  const cancelEditing = () => {
    setEditingTransactionId(null);
    setPopupMessage('Editing cancelled!');
    setShowPopup(true);
    setTimeout(() => setShowPopup(false), 3000);
  };

  return (
    <div className="max-w-5xl mx-auto p-5 font-sans text-gray-800">
      <h2 className="text-center text-blue-500 mb-5 text-2xl font-bold">Monthly Report</h2>
      {error && <p className="text-red-600 font-bold mb-5">{error}</p>}
      <div className="mb-5">
        <label htmlFor="month" className="block my-2 text-lg">Month:</label>
        <input
          type="month"
          id="month"
          value={selectedMonth}
          onChange={(e) => setSelectedMonth(e.target.value)}
          className="w-full p-2 border border-gray-300 rounded mb-5"
        />
      </div>
      <div className="mb-5">
        <label htmlFor="filterType" className="block my-2 text-lg">Filter by Type:</label>
        <select
          id="filterType"
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
          className="w-full p-2 border border-gray-300 rounded mb-5"
        >
          <option value="all">All</option>
          <option value="income">Income</option>
          <option value="expense">Expense</option>
        </select>
      </div>
      <div className="mb-5">
        <label htmlFor="filterCategory" className="block my-2 text-lg">Filter by Category:</label>
        <select
          id="filterCategory"
          value={filterCategory}
          onChange={(e) => setFilterCategory(e.target.value)}
          className="w-full p-2 border border-gray-300 rounded mb-5"
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
      <div className="mb-5">
        <label htmlFor="date" className="block my-2 text-lg">Filter by Date:</label>
        <input
          type="date"
          id="date"
          value={selectedDate}
          onChange={(e) => setSelectedDate(e.target.value)}
          className="w-full p-2 border border-gray-300 rounded mb-5"
        />
      </div>
      <div className="mb-5">
        <label htmlFor="currency" className="block my-2 text-lg">Currency:</label>
        <select
          id="currency"
          value={selectedCurrency}
          onChange={(e) => setSelectedCurrency(e.target.value)}
          className="w-full p-2 border border-gray-300 rounded mb-5"
        >
          {currencies.map(curr => (
            <option key={curr} value={curr}>{curr}</option>
          ))}
        </select>
      </div>
      <div className="mb-5">
        <div className="bg-blue-100 p-4 rounded mb-3">
          <h3 className="text-lg font-semibold">Total Income: {totalIncome.toFixed(2)} {selectedCurrency}</h3>
        </div>
        <div className="bg-red-100 p-4 rounded mb-3">
          <h3 className="text-lg font-semibold">Total Expenses: {totalExpenses.toFixed(2)} {selectedCurrency}</h3>
        </div>
        <div className="bg-yellow-100 p-4 rounded mb-3">
          <h3 className="text-lg font-semibold">Total Debt: {totalDebt.toFixed(2)} {selectedCurrency}</h3>
        </div>
      </div>
      <div className="mb-5">
        <h3 className="text-lg font-semibold">Income</h3>
        <ul className="list-none p-0">
          {filteredTransactions.filter(t => t.type === 'income').map(transaction => (
            <li key={transaction.id} className="bg-gray-100 border border-gray-300 rounded p-3 mb-3 relative">
              {editingTransactionId === transaction.id ? (
                <>
                  <input
                    type="number"
                    defaultValue={transaction.amount}
                    onBlur={(e) => handleEditTransaction({
                      ...transaction,
                      amount: parseFloat(e.target.value)
                    })}
                    className="w-1/2 inline-block mr-2"
                  />
                  <input
                    type="date"
                    defaultValue={transaction.date.split('T')[0]}
                    onBlur={(e) => handleEditTransaction({
                      ...transaction,
                      date: e.target.value
                    })}
                    className="w-1/2 inline-block"
                  />
                  <button onClick={cancelEditing} className="bg-blue-500 text-white p-2 rounded ml-2 hover:bg-blue-700">Cancel</button>
                  <button onClick={() => handleEditTransaction(transaction)} className="bg-blue-500 text-white p-2 rounded ml-2 hover:bg-blue-700">Update</button>
                </>
              ) : (
                <>
                  <span onClick={() => startEditing(transaction.id)} className="block mb-2 cursor-pointer text-lg font-medium">
                    <span className="block text-blue-600">{transaction.category}</span>
                    <span className="block text-gray-700">
                      {convertToSelectedCurrency(transaction.amount, transaction.currency).toFixed(2)} {selectedCurrency}
                    </span>
                    <span className="block text-gray-500">{transaction.date.split('T')[0]}</span>
                    {transaction.description && <span className="block text-gray-400 italic">{transaction.description}</span>}
                  </span>
                  <div className="absolute right-2 top-2">
                    <button onClick={() => handleRemoveTransaction(transaction.id)} className="bg-gray-500 text-white p-2 rounded hover:bg-red-700">Remove</button>
                  </div>
                </>
              )}
            </li>
          ))}
        </ul>
      </div>
      <div className="mb-5">
        <h3 className="text-lg font-semibold">Expenses</h3>
        <ul className="list-none p-0">
          {filteredTransactions.filter(t => t.type === 'expense').map(transaction => (
            <li key={transaction.id} className="bg-gray-100 border border-gray-300 rounded p-3 mb-3 relative">
              {editingTransactionId === transaction.id ? (
                <>
                  <input
                    type="number"
                    defaultValue={transaction.amount}
                    onBlur={(e) => handleEditTransaction({
                      ...transaction,
                      amount: parseFloat(e.target.value)
                    })}
                    className="w-1/2 inline-block mr-2"
                  />
                  <input
                    type="date"
                    defaultValue={transaction.date.split('T')[0]}
                    onBlur={(e) => handleEditTransaction({
                      ...transaction,
                      date: e.target.value
                    })}
                    className="w-1/2 inline-block"
                  />
                  <button onClick={cancelEditing} className="bg-blue-500 text-white p-2 rounded ml-2 hover:bg-blue-700">Cancel</button>
                  <button onClick={() => handleEditTransaction(transaction)} className="bg-blue-500 text-white p-2 rounded ml-2 hover:bg-blue-700">Update</button>
                </>
              ) : (
                <>
                  <span onClick={() => startEditing(transaction.id)} className="block mb-2 cursor-pointer text-lg font-medium">
                    <span className="block text-blue-600">{transaction.category}</span>
                    <span className="block text-gray-700">
                      {convertToSelectedCurrency(transaction.amount, transaction.currency).toFixed(2)} {selectedCurrency}
                    </span>
                    <span className="block text-gray-500">{transaction.date.split('T')[0]}</span>
                    {transaction.description && <span className="block text-gray-400 italic">{transaction.description}</span>}
                  </span>
                  <div className="absolute right-2 top-2">
                    <button onClick={() => handleRemoveTransaction(transaction.id)} className="bg-gray-500 text-white p-2 rounded hover:bg-red-700">Remove</button>
                  </div>
                </>
              )}
            </li>
          ))}
        </ul>
      </div>
      {showPopup && <div className={`fixed bottom-5 right-5 bg-green-500 text-white p-3 rounded shadow-lg ${showPopup ? 'block' : 'hidden'}`}>{popupMessage}</div>}
    </div>
  );
};

export default MonthlyReport;