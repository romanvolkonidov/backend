import React, { useContext, useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';
import { GlobalStateContext } from '../context/GlobalStateContext';
import '../styles/Home.css';

const expenseCategories = ['Rent', 'Utilities', 'Groceries', 'Clothing', 'Transportation', 'Healthcare', 'Personal Care', 'Household Items', 'Friends', 'Entertainment', 'Online Subscriptions', 'Savings'];
const currencies = ['KES', 'USD', 'RUB'];

const Home = () => {
  const { transactions, expectedIncome, addTransaction, updateExpectedIncome, exchangeRates, error: globalError, loading } = useContext(GlobalStateContext);
  const [transactionType, setTransactionType] = useState('expense');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [currency, setCurrency] = useState('KES');
  const [notification, setNotification] = useState('');
  const [error, setError] = useState(null);
  const [localExpectedIncome, setLocalExpectedIncome] = useState(expectedIncome);
  const [selectedDisplayCurrency, setSelectedDisplayCurrency] = useState('KES');

  useEffect(() => {
    setLocalExpectedIncome(expectedIncome);
  }, [expectedIncome]);

  useEffect(() => {
    if (globalError) {
      setError(globalError);
    }
  }, [globalError]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      // Convert the amount to KES for storage based on the selected currency
      const amountInKES = parseFloat(amount) * (exchangeRates[currency] || 1);

      if (transactionType === 'expectedIncome') {
        // Update expected income in KES
        await updateExpectedIncome(amountInKES);
        setLocalExpectedIncome(amountInKES); // Update local state immediately
        setNotification('Expected Income updated successfully!');
      } else if ((transactionType === 'expense' && selectedCategory) || transactionType === 'income') {
        const newTransaction = {
          type: transactionType,
          category: transactionType === 'income' ? 'Income' : selectedCategory,
          amount: parseFloat(amount), // Store the original amount in the selected currency
          description: description,
          currency: currency,
        };
        await addTransaction(newTransaction);
        setNotification('Transaction added successfully!');
      }

      // Reset form fields
      setSelectedCategory('');
      setAmount('');
      setDescription('');
      setCurrency('KES');
      setTransactionType('expense'); // Reset to default value

      // Clear notification after 3 seconds
      setTimeout(() => setNotification(''), 3000);
    } catch (error) {
      console.error("Error submitting form: ", error);
      setError("Failed to submit data. Please try again later.");
    }
  };

  const convertToSelectedCurrency = (amount, currency) => {
    // No conversion needed if the selected display currency is KES
    if (selectedDisplayCurrency === 'KES') {
      return amount;
    }

    if (!exchangeRates || !exchangeRates[currency] || !exchangeRates[selectedDisplayCurrency]) {
      return amount; // Return the original amount if rates are not available
    }

    const rate = exchangeRates[selectedDisplayCurrency] / exchangeRates[currency];
    const convertedAmount = amount * rate;

    // Round the converted amount to two decimal places
    return parseFloat(convertedAmount.toFixed(2));
  };

  // Prepare data for the bar chart
  const data = [
    { 
      name: 'Expected Income', 
      value: convertToSelectedCurrency(localExpectedIncome, 'KES') // Always convert expected income to the selected display currency
    }, 
    { 
      name: 'Actual Income', 
      value: transactions.filter(t => t.type === 'income').reduce((sum, t) => sum + convertToSelectedCurrency(t.amount, t.currency || 'KES'), 0) 
    }, 
    { 
      name: 'Expenses', 
      value: transactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + convertToSelectedCurrency(t.amount, t.currency || 'KES'), 0) 
    }
  ];

  if (loading) {
    return <div className="loading">Loading data...</div>;
  }

  return (
    <div className="home">
      {/* ... (rest of the component remains the same) ... */}
    </div>
  );
};

export default Home;
