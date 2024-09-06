import React, { useContext, useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';
import { GlobalStateContext } from '../context/GlobalStateContext';
import '../styles/Home.css';

const expenseCategories = ['Rent', 'Utilities', 'Groceries', 'Clothing', 'Transportation', 'Healthcare', 'Personal Care', 'Household Items', 'Friends', 'Entertainment', 'Online Subscriptions', 'Savings'];

const Home = () => {
  const { transactions, expectedIncome, addTransaction, updateExpectedIncome } = useContext(GlobalStateContext);
  const [transactionType, setTransactionType] = useState('expense');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [notification, setNotification] = useState('');
  const [error, setError] = useState(null);
  const [localExpectedIncome, setLocalExpectedIncome] = useState(expectedIncome);

  useEffect(() => {
    setLocalExpectedIncome(expectedIncome);
  }, [expectedIncome]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (transactionType === 'expectedIncome') {
        await updateExpectedIncome(parseFloat(amount));
        setLocalExpectedIncome(parseFloat(amount)); // Update local state immediately
        setNotification('Expected Income updated successfully!');
      } else if ((transactionType === 'expense' && selectedCategory) || transactionType === 'income') {
        const newTransaction = {
          type: transactionType,
          category: transactionType === 'income' ? 'Income' : selectedCategory,
          amount: parseFloat(amount),
          description: description,
        };
        await addTransaction(newTransaction);
        setNotification('Transaction added successfully!');
      }
      // Reset form fields
      setSelectedCategory('');
      setAmount('');
      setDescription('');
      setTransactionType('expense'); // Reset to default value

      // Clear notification after 3 seconds
      setTimeout(() => setNotification(''), 3000);
    } catch (error) {
      console.error("Error submitting form: ", error);
      setError("Failed to submit data. Please try again later.");
    }
  };

  // Prepare data for the bar chart
  const data = [
    { name: 'Expected Income', value: localExpectedIncome }, // Use localExpectedIncome here
    { name: 'Actual Income', value: transactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0) },
    { name: 'Expenses', value: transactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0) }
  ];

  return (
    <div className="home">
      <h2 className="home-title">Income and Expense Tracker</h2>

      {/* Error handling */}
      {error && <p className="error-message">{error}</p>}

      {/* Responsive Bar Chart */}
      <div style={{ width: '100%', height: 400 }}>
        <ResponsiveContainer>
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
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
          <label htmlFor="amount" aria-label="Enter Amount">Amount (KSH)</label>
          <input type="number" id="amount" name="amount" value={amount} onChange={(e) => setAmount(e.target.value)} required />
        </div>
        <button type="submit" className="submit-button" aria-label="Add Transaction">Add Transaction</button>
      </form>

      {/* Notification Message */}
      {notification && <p className="notification">{notification}</p>}
    </div>
  );
};

export default Home;
