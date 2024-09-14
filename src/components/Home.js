import React, { useContext, useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';
import { GlobalStateContext } from '../context/GlobalStateContext';
import 'tailwindcss/tailwind.css';

const expenseCategories = ['Rent', 'Utilities', 'Groceries', 'Clothing', 'Transportation', 'Healthcare', 'Personal Care', 'Household Items', 'Friends', 'Entertainment', 'Mobile phones', 'Others', 'Online Subscriptions', 'Savings', 'Debt Repayment'];
const currencies = ['USD', 'KES', 'RUB', 'EUR'];

const Home = () => {
  const { transactions, expectedIncome, addTransaction, updateExpectedIncome, exchangeRates, error: globalError, loading, debt, setDebtAmount, convertAmount } = useContext(GlobalStateContext);
  const [transactionType, setTransactionType] = useState('expense');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [currency, setCurrency] = useState('USD');
  const [notification, setNotification] = useState('');
  const [error, setError] = useState(null);
  const [selectedDisplayCurrency, setSelectedDisplayCurrency] = useState('USD');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().slice(0, 7));
  const [dateRange, setDateRange] = useState('month');
  const [showPopup, setShowPopup] = useState(false);

  useEffect(() => {
    if (globalError) {
      setError(globalError);
    }
  }, [globalError]);

  const convertToSelectedCurrency = (amount, currency) => {
    if (!exchangeRates[currency] || !exchangeRates[selectedDisplayCurrency]) {
      console.error(`Missing exchange rate for ${currency} or ${selectedDisplayCurrency}`);
      return 0;
    }
    const rate = exchangeRates[selectedDisplayCurrency] / exchangeRates[currency];
    return amount * rate;
  };

  const convertTransactions = (transactions, toCurrency) => {
    return transactions.map(transaction => {
      const convertedAmount = convertToSelectedCurrency(transaction.amount, transaction.currency);
      return { ...transaction, amount: convertedAmount, currency: toCurrency };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const amountInSelectedCurrency = parseFloat(amount);

      if (transactionType === 'expense' && !selectedCategory) {
        setError("Please select a category for the expense.");
        return;
      }

      if (transactionType === 'expectedIncome') {
        await updateExpectedIncome(amountInSelectedCurrency, currency);
        setNotification('Expected Income updated successfully!');
      } else if (transactionType === 'setDebt') {
        await setDebtAmount(amountInSelectedCurrency, currency);
        setNotification('Debt set successfully!');
      } else if ((transactionType === 'expense' && selectedCategory) || transactionType === 'income') {
        const newTransaction = {
          type: transactionType,
          category: transactionType === 'income' ? 'Income' : selectedCategory,
          amount: amountInSelectedCurrency,
          description: description,
          currency: currency,
          date: new Date().toISOString().slice(0, 10),
        };
        await addTransaction(newTransaction);
        setNotification('Transaction added successfully!');

        if (transactionType === 'expense' && selectedCategory === 'Debt Repayment') {
          const convertedAmount = convertAmount(amountInSelectedCurrency, currency, debt.currency);
          await setDebtAmount(debt.amount - convertedAmount, debt.currency);
        }
      }

      setSelectedCategory('');
      setAmount('');
      setDescription('');
      setCurrency('USD');
      setTransactionType('expense');

      setShowPopup(true);
      setTimeout(() => setShowPopup(false), 3000);

      setTimeout(() => setNotification(''), 3000);
      setError(null);
    } catch (error) {
      console.error("Error submitting form: ", error);
      setError("Failed to submit data. Please try again later.");
    }
  };

  const filteredTransactions = transactions.filter(t => {
    if (dateRange === 'month') {
      return t.date.startsWith(selectedDate);
    } else {
      return t.date.startsWith(selectedDate.slice(0, 4));
    }
  });

  const convertedTransactions = convertTransactions(filteredTransactions, selectedDisplayCurrency);

  const data = [
    { name: 'Expected Income', value: convertToSelectedCurrency(expectedIncome.amount, expectedIncome.currency) },
    { name: 'Actual Income', value: convertedTransactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0) },
    { name: 'Expenses', value: convertedTransactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0) },
    { name: 'Debt', value: convertToSelectedCurrency(debt.amount, debt.currency) }
  ];

  if (loading) {
    return <div className="loading text-center text-xl font-semibold">Loading data...</div>;
  }

  return (
    <div className="home p-6 bg-gray-100 min-h-screen">
      <h2 className="home-title text-4xl font-bold mb-8 text-center text-indigo-600">Income and Expense Tracker</h2>

      <div className="exchange-rates mb-8 p-6 bg-white rounded-lg shadow-md">
        <p className="exchange-rates-title text-2xl font-semibold mb-4 text-indigo-500">Exchange Rates (1 USD)</p>
        <div className="grid grid-cols-2 gap-4">
          {Object.entries(exchangeRates).map(([currency, rate]) => (
            <p key={currency} className="text-lg text-gray-700">{currency}: {rate.toFixed(2)}</p>
          ))}
        </div>
      </div>

      {error && <p className="error-message text-red-500 mb-4 text-center">{error}</p>}

      <div className="selectors mb-8 p-6 bg-white rounded-lg shadow-md">
        <div className="currency-selector mb-6">
          <label htmlFor="displayCurrency" className="block text-lg font-medium mb-2 text-gray-700">Display Currency:</label>
          <select id="displayCurrency" value={selectedDisplayCurrency} onChange={(e) => setSelectedDisplayCurrency(e.target.value)} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 text-lg">
            {currencies.map(curr => (
              <option key={curr} value={curr}>{curr}</option>
            ))}
          </select>
        </div>
        <div className="date-range-selector mb-6">
          <label className="block text-lg font-medium mb-2 text-gray-700">Date Range:</label>
          <div className="mt-1 flex space-x-4">
            <label className="inline-flex items-center">
              <input
                type="radio"
                name="dateRange"
                value="month"
                checked={dateRange === 'month'}
                onChange={() => setDateRange('month')}
                className="form-radio text-indigo-600"
              />
              <span className="ml-2 text-lg text-gray-700">Month</span>
            </label>
            <label className="inline-flex items-center">
              <input
                type="radio"
                name="dateRange"
                value="year"
                checked={dateRange === 'year'}
                onChange={() => setDateRange('year')}
                className="form-radio text-indigo-600"
              />
              <span className="ml-2 text-lg text-gray-700">Year</span>
            </label>
          </div>
        </div>
        <div className="date-selector mb-6">
          <label htmlFor="displayDate" className="block text-lg font-medium mb-2 text-gray-700">{dateRange === 'month' ? 'Display Month:' : 'Display Year:'}</label>
          <input
            type={dateRange === 'month' ? 'month' : 'number'}
            id="displayDate"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            min={dateRange === 'year' ? '1900' : undefined}
            max={dateRange === 'year' ? new Date().getFullYear() : undefined}
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 text-lg"
          />
        </div>
      </div>

      <div style={{ width: '100%', height: 400 }} className="mb-8">
        <ResponsiveContainer>
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip formatter={(value) => `${value.toFixed(2)} ${selectedDisplayCurrency}`} />
            <Legend />
            <Bar dataKey="value" radius={[10, 10, 0, 0]} fillOpacity={0.8}>
              {data.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={
                    entry.name === 'Expected Income'
                      ? 'rgba(255, 215, 0, 0.8)'
                      : entry.name === 'Actual Income'
                      ? 'rgba(0, 255, 0, 0.8)'
                      : entry.name === 'Expenses'
                      ? 'rgba(255, 140, 0, 0.8)'
                      : 'rgba(255, 0, 0, 0.8)' // Color for Debt
                  }
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      <form onSubmit={handleSubmit} className="transaction-form space-y-6 p-6 bg-white rounded-lg shadow-md">
        <div className="form-group">
          <label htmlFor="transactionType" className="block text-lg font-medium mb-2 text-gray-700">Transaction Type</label>
          <select id="transactionType" name="transactionType" value={transactionType} onChange={(e) => setTransactionType(e.target.value)} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 text-lg">
            <option value="expense">Expense</option>
            <option value="income">Income</option>
            <option value="expectedIncome">Expected Income</option>
            <option value="setDebt">Set Debt</option>
          </select>
        </div>
        {transactionType !== 'expectedIncome' && transactionType !== 'setDebt' && selectedCategory !== 'Debt Repayment' && (
          <div className="form-group">
            <label htmlFor="description" className="block text-lg font-medium mb-2 text-gray-700">Description</label>
            <input type="text" id="description" name="description" value={description} onChange={(e) => setDescription(e.target.value)} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 text-lg" />
          </div>
        )}
        <div className="form-group">
          <label htmlFor="amount" className="block text-lg font-medium mb-2 text-gray-700">Amount</label>
          <input type="number" id="amount" name="amount" value={amount} onChange={(e) => setAmount(e.target.value)} required className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 text-lg" />
        </div>
        <div className="form-group">
          <label htmlFor="currency" className="block text-lg font-medium mb-2 text-gray-700">Currency</label>
          <select id="currency" name="currency" value={currency} onChange={(e) => setCurrency(e.target.value)} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 text-lg">
            {currencies.map(curr => (
              <option key={curr} value={curr}>{curr}</option>
            ))}
          </select>
        </div>
        {transactionType === 'expense' && (
          <div className="form-group">
            <label htmlFor="category" className="block text-lg font-medium mb-2 text-gray-700">Category</label>
            <select id="category" name="category" value={selectedCategory} onChange={(e) => setSelectedCategory(e.target.value)} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 text-lg">
              <option value="">Select Category</option>
              {expenseCategories.map(category => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>
          </div>
        )}
        {error && <p className="error-message text-red-500 text-center">{error}</p>}
        <button type="submit" className="submit-button bg-indigo-600 text-white py-2 px-4 rounded-md shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 text-lg">Add Transaction</button>
      </form>

      {notification && <p className="notification text-green-500 mt-4 text-center">{notification}</p>}

      {showPopup && <div className="popup fixed top-0 left-0 right-0 bottom-0 flex items-center justify-center bg-black bg-opacity-50">
        <div className="bg-white p-4 rounded-md shadow-md">
          <p className="text-lg font-semibold">Submission Successful!</p>
        </div>
      </div>}
    </div>
  );
}

export default Home;