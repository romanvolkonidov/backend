import React, { useContext, useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';
import { GlobalStateContext } from '../context/GlobalStateContext';
import '../styles/Home.css';

const expenseCategories = ['Rent', 'Utilities', 'Groceries', 'Clothing', 'Transportation', 'Healthcare', 'Personal Care', 'Household Items', 'Friends', 'Entertainment', 'Mobile phones', 'Others', 'Online Subscriptions', 'Savings'];
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
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().slice(0, 7)); // Default to current month
  const [dateRange, setDateRange] = useState('month'); // Default to month
  const [showPopup, setShowPopup] = useState(false);

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
      const amountInSelectedCurrency = parseFloat(amount);

      // Validation for expense category
      if (transactionType === 'expense' && !selectedCategory) {
        setError("Please select a category for the expense.");
        return;
      }

      if (transactionType === 'expectedIncome') {
        await updateExpectedIncome(amountInSelectedCurrency);
        setLocalExpectedIncome(amountInSelectedCurrency); // Update local state immediately
        setNotification('Expected Income updated successfully!');
      } else if ((transactionType === 'expense' && selectedCategory) || transactionType === 'income') {
        const newTransaction = {
          type: transactionType,
          category: transactionType === 'income' ? 'Income' : selectedCategory,
          amount: amountInSelectedCurrency,
          description: description,
          currency: currency,
          date: new Date().toISOString().slice(0, 10), // Add current date
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

      // Show popup
      setShowPopup(true);
      setTimeout(() => setShowPopup(false), 3000); // Hide popup after 3 seconds

      // Clear notification after 3 seconds
      setTimeout(() => setNotification(''), 3000);
      setError(null); // Clear error message after successful submission
    } catch (error) {
      console.error("Error submitting form: ", error);
      setError("Failed to submit data. Please try again later.");
    }
  };

  const convertToSelectedCurrency = (amount, currency) => {
    if (!exchangeRates || !exchangeRates[currency] || !exchangeRates[selectedDisplayCurrency]) {
      return amount;
    }
    const rate = exchangeRates[selectedDisplayCurrency] / exchangeRates[currency];
    return amount * rate;
  };

  // Filter transactions based on the selected date range
  const filteredTransactions = transactions.filter(t => {
    if (dateRange === 'month') {
      return t.date.startsWith(selectedDate);
    } else {
      return t.date.startsWith(selectedDate.slice(0, 4));
    }
  });

  // Prepare data for the bar chart
  const data = [
    { name: 'Expected Income', value: convertToSelectedCurrency(localExpectedIncome, 'KES') }, // Use localExpectedIncome here
    { name: 'Actual Income', value: filteredTransactions.filter(t => t.type === 'income').reduce((sum, t) => sum + convertToSelectedCurrency(t.amount, t.currency || 'KES'), 0) },
    { name: 'Expenses', value: filteredTransactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + convertToSelectedCurrency(t.amount, t.currency || 'KES'), 0) }
  ];

  if (loading) {
    return <div className="loading">Loading data...</div>;
  }

  return (
    <div className="home">
      <h2 className="home-title">Income and Expense Tracker</h2>

      {/* Display Exchange Rates */}
      <div className="exchange-rates" style={{ textAlign: 'center', margin: '20px 0' }}>
        <p style={{ fontSize: '18px', fontWeight: 'bold' }}>Exchange Rates</p>
        <p>USD to KES: {exchangeRates.KES ? exchangeRates.KES.toFixed(2) : 'Loading...'}</p>
        <p>USD to RUB: {exchangeRates.RUB ? exchangeRates.RUB.toFixed(2) : 'Loading...'}</p>
      </div>

      {/* Error handling */}
      {error && <p className="error-message">{error}</p>}

      {/* Currency and Date Range Selection */}
      <div className="selectors">
        <div className="currency-selector">
          <label htmlFor="displayCurrency" aria-label="Select Display Currency">Display Currency:</label>
          <select id="displayCurrency" name="displayCurrency" value={selectedDisplayCurrency} onChange={(e) => setSelectedDisplayCurrency(e.target.value)}>
            {currencies.map(curr => (
              <option key={curr} value={curr}>{curr}</option>
            ))}
          </select>
        </div>
        <div className="date-range-selector">
          <label>
            <input
              type="radio"
              name="dateRange"
              value="month"
              checked={dateRange === 'month'}
              onChange={() => setDateRange('month')}
            />
            Month
          </label>
          <label>
            <input
              type="radio"
              name="dateRange"
              value="year"
              checked={dateRange === 'year'}
              onChange={() => setDateRange('year')}
            />
            Year
          </label>
        </div>
        <div className="date-selector">
          <label htmlFor="displayDate" aria-label="Select Display Date">{dateRange === 'month' ? 'Display Month:' : 'Display Year:'}</label>
          <input
            type={dateRange === 'month' ? 'month' : 'number'}
            id="displayDate"
            name="displayDate"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            min={dateRange === 'year' ? '1900' : undefined}
            max={dateRange === 'year' ? new Date().getFullYear() : undefined}
          />
        </div>
      </div>

      {/* Responsive Bar Chart */}
      <div style={{ width: '100%', height: 400 }}>
        <ResponsiveContainer>
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip formatter={(value) => value.toFixed(2)} />
            <Legend formatter={(value) => value.replace('value', '')} />
            <Bar dataKey="value" radius={[10, 10, 0, 0]} fillOpacity={0.8}>
              {data.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={
                    entry.name === 'Expected Income'
                      ? 'rgba(255, 215, 0, 0.8)'
                      : entry.name === 'Actual Income'
                      ? 'rgba(0, 255, 0, 0.8)'
                      : 'rgba(255, 140, 0, 0.8)'
                  }
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Transaction Form */}
      <form onSubmit={handleSubmit} className="transaction-form">
        <div className="form-group">
          <label htmlFor="transactionType" aria-label="Select Transaction Type">Transaction Type</label>
          <select id="transactionType" name="transactionType" value={transactionType} onChange={(e) => setTransactionType(e.target.value)}>
            <option value="expense">Expense</option>
            <option value="income">Income</option>
            <option value="expectedIncome">Expected Income</option>
          </select>
        </div>
        {transactionType === 'expense' && (
          <div className="form-group">
            <label htmlFor="category" aria-label="Select Category">Category</label>
            <select id="category" name="category" value={selectedCategory} onChange={(e) => setSelectedCategory(e.target.value)}>
              <option value="">Select a category</option>
              {expenseCategories.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </div>
        )}
        {transactionType !== 'expectedIncome' && (
          <div className="form-group">
            <label htmlFor="description" aria-label="Enter Description">Description</label>
            <input type="text" id="description" name="description" value={description} onChange={(e) => setDescription(e.target.value)} required />
          </div>
        )}
        <div className="form-group">
          <label htmlFor="amount" aria-label="Enter Amount">Amount</label>
          <input type="number" id="amount" name="amount" value={amount} onChange={(e) => setAmount(e.target.value)} required />
        </div>
        <div className="form-group">
          <label htmlFor="currency" aria-label="Select Currency">Currency</label>
          <select id="currency" name="currency" value={currency} onChange={(e) => setCurrency(e.target.value)}>
            {currencies.map(curr => (
              <option key={curr} value={curr}>{curr}</option>
            ))}
          </select>
        </div>
        {error && <p className="error-message">{error}</p>}
        <button type="submit" className="submit-button" aria-label="Add Transaction">Add Transaction</button>
      </form>

      {/* Notification Message */}
      {notification && <p className="notification">{notification}</p>}

      {/* Submission Popup */}
      {showPopup && <div className="popup">Submission Successful!</div>}
    </div>
  );
};

export default Home;
