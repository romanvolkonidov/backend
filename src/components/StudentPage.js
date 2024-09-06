import React, { useState, useEffect, useContext } from 'react';
import { useParams } from 'react-router-dom';
import { Bar } from 'react-chartjs-2';
import { GlobalStateContext } from '../context/GlobalStateContext';
import 'chart.js/auto';
import '../styles/StudentPage.css';
import { db } from '../firebase';
import { collection, addDoc, deleteDoc, doc, updateDoc } from 'firebase/firestore';

const currencies = ['USD', 'KES', 'RUB', 'EUR'];

const StudentPage = () => {
  const { students, transactions, setTransactions, exchangeRates } = useContext(GlobalStateContext);
  const { id } = useParams();
  const [student, setStudent] = useState(null);
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [lessonDescription, setLessonDescription] = useState('');
  const [lessonDate, setLessonDate] = useState(new Date().toISOString().slice(0, 10));
  const [selectedSubject, setSelectedSubject] = useState('English');
  const [editingPaymentId, setEditingPaymentId] = useState(null);
  const [editingLessonId, setEditingLessonId] = useState(null);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('All');
  const [currency, setCurrency] = useState('USD');
  const [displayCurrency, setDisplayCurrency] = useState('USD');
  const [convertedTransactions, setConvertedTransactions] = useState([]);
  const [feedback, setFeedback] = useState('');

  useEffect(() => {
    const foundStudent = students.find(s => s.id === id);
    setStudent(foundStudent);
  }, [id, students]);

  const handleAddPayment = async (e) => {
    e.preventDefault();
    if (amount && date && student && currency) {
      setError(null);
      const newTransaction = { type: 'income', category: student.name, amount: parseFloat(amount), date, currency };
      try {
        const docRef = await addDoc(collection(db, 'transactions'), newTransaction);
        const updatedTransactions = [...transactions, { id: docRef.id, ...newTransaction }];
        setTransactions(updatedTransactions);
        resetPaymentForm();
        setFeedback('Payment added successfully');
      } catch (error) {
        setError("Error adding payment");
      }
    } else {
      setError("Please fill out all fields");
    }
  };

  const handleAddLesson = async (e) => {
    e.preventDefault();
    if (selectedSubject && student) {
      setError(null);
      const newLesson = { type: 'lesson', category: student.name, description: lessonDescription, date: lessonDate, subject: selectedSubject };
      try {
        const docRef = await addDoc(collection(db, 'transactions'), newLesson);
        const updatedTransactions = [...transactions, { id: docRef.id, ...newLesson }];
        setTransactions(updatedTransactions);
        resetLessonForm();
        setFeedback('Lesson added successfully');
      } catch (error) {
        setError("Error adding lesson");
      }
    } else {
      setError("Please fill out all fields");
    }
  };

  const handleRemoveTransaction = async (id) => {
    setError(null);
    try {
      await deleteDoc(doc(db, 'transactions', id));
      setTransactions(transactions.filter(transaction => transaction.id !== id));
      setFeedback('Transaction removed successfully');
    } catch (error) {
      setError("Error removing transaction");
    }
  };

  const handleEditPayment = (id) => {
    const payment = transactions.find(transaction => transaction.id === id);
    if (payment) {
      setEditingPaymentId(id);
      setAmount(payment.amount);
      setDate(payment.date);
      setCurrency(payment.currency);
    } else {
      setError("Payment not found");
    }
  };

  const handleEditLesson = (id) => {
    const lesson = transactions.find(transaction => transaction.id === id);
    if (lesson) {
      setEditingLessonId(id);
      setLessonDescription(lesson.description);
      setLessonDate(lesson.date);
      setSelectedSubject(lesson.subject);
    } else {
      setError("Lesson not found");
    }
  };

  const handleUpdatePayment = async (e) => {
    e.preventDefault();
    setError(null);
    try {
      const transactionDoc = doc(db, 'transactions', editingPaymentId);
      await updateDoc(transactionDoc, { amount: parseFloat(amount), date, currency });
      setTransactions(transactions.map(transaction => transaction.id === editingPaymentId ? { ...transaction, amount: parseFloat(amount), date, currency } : transaction));
      resetPaymentForm();
      setFeedback('Payment updated successfully');
    } catch (error) {
      setError("Error updating payment");
    }
  };

  const handleUpdateLesson = async (e) => {
    e.preventDefault();
    setError(null);
    try {
      const transactionDoc = doc(db, 'transactions', editingLessonId);
      await updateDoc(transactionDoc, { description: lessonDescription, date: lessonDate, subject: selectedSubject });
      setTransactions(transactions.map(transaction => transaction.id === editingLessonId ? { ...transaction, description: lessonDescription, date: lessonDate, subject: selectedSubject } : transaction));
      resetLessonForm();
      setFeedback('Lesson updated successfully');
    } catch (error) {
      setError("Error updating lesson");
    }
  };

  const resetPaymentForm = () => {
    setEditingPaymentId(null);
    setAmount('');
    setDate(new Date().toISOString().slice(0, 10));
    setCurrency('USD');
  };

  const resetLessonForm = () => {
    setEditingLessonId(null);
    setLessonDescription('');
    setLessonDate(new Date().toISOString().slice(0, 10));
    setSelectedSubject('English');
  };

  const convertToSelectedCurrency = (amount, currency) => {
    if (!exchangeRates[currency] || !exchangeRates[displayCurrency]) {
      console.error(`Missing exchange rate for ${currency} or ${displayCurrency}`);
      return 0;
    }
    const rate = exchangeRates[displayCurrency] / exchangeRates[currency];
    return amount * rate;
  };

  const convertTransactions = (transactions, toCurrency) => {
    const convertedTransactions = transactions.map(transaction => {
      const convertedAmount = convertToSelectedCurrency(transaction.amount, transaction.currency);
      return { ...transaction, amount: convertedAmount, currency: toCurrency };
    });
    return convertedTransactions;
  };

  useEffect(() => {
    const updateConvertedTransactions = () => {
      const converted = convertTransactions(transactions, displayCurrency);
      setConvertedTransactions(converted);
    };
    updateConvertedTransactions();
  }, [displayCurrency, transactions, exchangeRates]);

  if (!student) {
    return <div>Student not found</div>;
  }

  const filteredTransactions = convertedTransactions.filter(transaction => transaction.category === student.name);
  const payments = filteredTransactions.filter(transaction => transaction.type === 'income');
  const lessons = filteredTransactions.filter(transaction => transaction.type === 'lesson');
  const englishLessons = lessons.filter(lesson => lesson.subject === 'English');
  const itLessons = lessons.filter(lesson => lesson.subject === 'IT');

  const totalPaidLessons = payments.reduce((sum, payment) => sum + convertToSelectedCurrency(payment.amount, payment.currency) / student.price, 0);
  const completedLessons = lessons.length;
  const remainingLessons = totalPaidLessons - completedLessons;
  const debtLessons = remainingLessons < 0 ? Math.abs(remainingLessons) : 0;
  const positiveRemainingLessons = remainingLessons > 0 ? remainingLessons : 0;

  const barData = {
    labels: ['Lessons'],
    datasets: [
      ...(debtLessons === 0 ? [{
        label: 'Remaining Lessons',
        data: [positiveRemainingLessons],
        backgroundColor: '#4caf50',
      }] : []),
      ...(debtLessons > 0 ? [{
        label: 'Debt Lessons',
        data: [debtLessons],
        backgroundColor: '#f44336',
      }] : []),
    ],
  };

  const barOptions = {
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          stepSize: 1,
        },
      },
    },
  };

  const displayedTransactions = filter === 'All' ? filteredTransactions :
    filter === 'Payments' ? payments :
    filter === 'Completed Lessons (English)' ? englishLessons :
    filter === 'Completed Lessons (IT)' ? itLessons : [];

    return (
      <div className="student-page">
        <div className="chart-info-container">
          <div className="student-info">
            <h2>{student.name}</h2>
            <p className="info-item"><strong>Price per Lesson:</strong> {student.currency} {student.price.toFixed(2)}</p>
            <p className="info-item"><strong>Lessons Purchased:</strong> {totalPaidLessons.toFixed(2)}</p>
            <p className="info-item"><strong>Lessons Completed:</strong> {completedLessons}</p>
            <p className="info-item"><strong>Remaining Lessons:</strong> {positiveRemainingLessons}</p>
            <p className="info-item"><strong>Debt Lessons:</strong> {debtLessons}</p>
          </div>
          <div className="chart-container">
            <div className="chart-wrapper">
              <Bar data={barData} options={barOptions} />
            </div>
          </div>
        </div>
        {error && <p className="error-message">{error}</p>}
        {feedback && <p className="feedback-message">{feedback}</p>}
        <div className="forms-container">
          <form onSubmit={editingPaymentId ? handleUpdatePayment : handleAddPayment}>
            <h3>{editingPaymentId ? 'Edit Payment' : 'Add Payment'}</h3>
            <div>
              <label htmlFor="amount">Amount:</label>
              <input type="number" id="amount" value={amount} onChange={(e) => setAmount(e.target.value)} required />
              <select id="currency" value={currency} onChange={(e) => setCurrency(e.target.value)} required>
                {currencies.map(curr => (
                  <option key={curr} value={curr}>{curr}</option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="date">Date:</label>
              <input type="date" id="date" value={date} onChange={(e) => setDate(e.target.value)} required />
            </div>
            <button type="submit" className="add-payment-button">{editingPaymentId ? 'Update Payment' : 'Add Payment'}</button>
          </form>
          <form onSubmit={editingLessonId ? handleUpdateLesson : handleAddLesson}>
            <h3>{editingLessonId ? 'Edit Lesson' : 'Add Lesson'}</h3>
            <div>
              <label htmlFor="lessonDescription">Lesson Description:</label>
              <input type="text" id="lessonDescription" value={lessonDescription} onChange={(e) => setLessonDescription(e.target.value)} />
            </div>
            <div>
              <label htmlFor="lessonDate">Lesson Date:</label>
              <input type="date" id="lessonDate" value={lessonDate} onChange={(e) => setLessonDate(e.target.value)} required />
            </div>
            <div>
              <label htmlFor="selectedSubject">Subject:</label>
              <select id="selectedSubject" value={selectedSubject} onChange={(e) => setSelectedSubject(e.target.value)} required>
                <option value="English">English</option>
                <option value="IT">IT</option>
              </select>
            </div>
            <button type="submit" className="add-lesson-button">{editingLessonId ? 'Update Lesson' : 'Add Lesson'}</button>
          </form>
        </div>
        <div className="dropdown">
          <select value={filter} onChange={(e) => setFilter(e.target.value)}>
            <option value="All">All Transactions</option>
            <option value="Payments">Payments</option>
            <option value="Completed Lessons (English)">Completed Lessons (English)</option>
            <option value="Completed Lessons (IT)">Completed Lessons (IT)</option>
          </select>
        </div>
        <div className="dropdown">
          <select value={displayCurrency} onChange={(e) => setDisplayCurrency(e.target.value)}>
            {currencies.map(curr => (
              <option key={curr} value={curr}>{curr}</option>
            ))}
          </select>
        </div>
        <div className="transactions-list">
          <h3>Payments</h3>
          <ul>
            {payments.map(transaction => (
              <li key={transaction.id} className="transaction-item">
                Payment of {transaction.amount.toFixed(2)} {transaction.currency} on {transaction.date}
                <div className="button-group">
                  <button onClick={() => handleEditPayment(transaction.id)}>Edit</button>
                  <button onClick={() => handleRemoveTransaction(transaction.id)} className="remove-button">Remove</button>
                </div>
              </li>
            ))}
          </ul>
          <h3>Completed Lessons</h3>
          <div className="sub-list">
            <h4>English</h4>
            <ul>
              {englishLessons.map(transaction => (
                <li key={transaction.id} className="transaction-item">
                  {transaction.description} on {transaction.date}
                  <div className="button-group">
                    <button onClick={() => handleEditLesson(transaction.id)}>Edit</button>
                    <button onClick={() => handleRemoveTransaction(transaction.id)} className="remove-button">Remove</button>
                  </div>
                </li>
              ))}
            </ul>
          </div>
          <div className="sub-list">
            <h4>IT</h4>
            <ul>
              {itLessons.map(transaction => (
                <li key={transaction.id} className="transaction-item">
                  {transaction.description} on {transaction.date}
                  <div className="button-group">
                    <button onClick={() => handleEditLesson(transaction.id)}>Edit</button>
                    <button onClick={() => handleRemoveTransaction(transaction.id)} className="remove-button">Remove</button>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    );
}

export default StudentPage;
