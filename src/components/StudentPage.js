import React, { useState, useEffect, useContext } from 'react';
import { useParams } from 'react-router-dom';
import { Bar } from 'react-chartjs-2';
import { GlobalStateContext } from '../context/GlobalStateContext';
import 'chart.js/auto';
import 'tailwindcss/tailwind.css';
import { db } from '../firebase';
import { collection, addDoc, deleteDoc, doc, updateDoc } from 'firebase/firestore';

const currencies = ['USD', 'KES', 'RUB', 'EUR'];

const StudentPage = () => {
  const { students, transactions, setTransactions, exchangeRates } = useContext(GlobalStateContext);
  const { id } = useParams();
  const [student, setStudent] = useState(null);
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState('');
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
  const [showPopup, setShowPopup] = useState(false);
  const [popupMessage, setPopupMessage] = useState('');

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
        setPopupMessage('Payment added successfully!');
        setShowPopup(true);
        setTimeout(() => setShowPopup(false), 3000); // Hide popup after 3 seconds
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
        setPopupMessage('Lesson added successfully!');
        setShowPopup(true);
        setTimeout(() => setShowPopup(false), 3000); // Hide popup after 3 seconds
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
      setPopupMessage('Payment updated successfully!');
      setShowPopup(true);
      setTimeout(() => setShowPopup(false), 3000); // Hide popup after 3 seconds
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
      setPopupMessage('Lesson updated successfully!');
      setShowPopup(true);
      setTimeout(() => setShowPopup(false), 3000); // Hide popup after 3 seconds
    } catch (error) {
      setError("Error updating lesson");
    }
  };

  const resetPaymentForm = () => {
    setEditingPaymentId(null);
    setAmount('');
    setDate('');
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
    return <div className="text-center text-red-500">Student not found</div>;
  }

  const filteredTransactions = convertedTransactions.filter(transaction => transaction.category === student.name);
  const payments = filteredTransactions.filter(transaction => transaction.type === 'income');
  const lessons = filteredTransactions.filter(transaction => transaction.type === 'lesson');
  const englishLessons = lessons.filter(lesson => lesson.subject === 'English');
  const itLessons = lessons.filter(lesson => lesson.subject === 'IT');

  const totalPaidLessons = payments.reduce((sum, payment) => sum + (convertToSelectedCurrency(payment.amount, payment.currency) / convertToSelectedCurrency(student.price, student.currency)), 0);
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
    filter === 'Payments' ? payments : lessons;

  return (
    <div className="max-w-5xl mx-auto p-5 font-sans text-gray-800">
      <div className="flex justify-between items-center mb-5">
        <div>
          <h2 className="text-2xl font-bold text-indigo-500">{student.name}</h2>
          <p className="text-lg"><strong>Price per Lesson:</strong> {displayCurrency} {(convertToSelectedCurrency(student.price, student.currency)).toFixed(2)}</p>
          <p className="text-lg"><strong>Lessons Purchased:</strong> {totalPaidLessons.toFixed(2)}</p>
          <p className="text-lg"><strong>Lessons Completed:</strong> {completedLessons}</p>
          <p className="text-lg"><strong>Remaining Lessons:</strong> {positiveRemainingLessons}</p>
          <p className="text-lg"><strong>Debt Lessons:</strong> {debtLessons}</p>
        </div>
        <div className="w-1/2">
          <Bar data={barData} options={barOptions} />
        </div>
      </div>
      {error && <p className="text-red-600 font-bold mb-5">{error}</p>}
      {showPopup && <div className="fixed bottom-5 right-5 bg-green-500 text-white p-3 rounded shadow-lg">{popupMessage}</div>}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-5">
        <form onSubmit={editingPaymentId ? handleUpdatePayment : handleAddPayment} className="bg-white p-5 rounded shadow-md">
          <h3 className="text-xl font-semibold mb-3">{editingPaymentId ? 'Edit Payment' : 'Add Payment'}</h3>
          <div className="mb-3">
            <label htmlFor="amount" className="block mb-1">Amount:</label>
            <input type="number" id="amount" value={amount} onChange={(e) => setAmount(e.target.value)} required className="w-full p-2 border border-gray-300 rounded" />
            <select id="currency" value={currency} onChange={(e) => setCurrency(e.target.value)} required className="w-full p-2 border border-gray-300 rounded mt-2">
              {currencies.map(curr => (
                <option key={curr} value={curr}>{curr}</option>
              ))}
            </select>
          </div>
          <div className="mb-3">
            <label htmlFor="date" className="block mb-1">Date:</label>
            <input type="date" id="date" value={date} onChange={(e) => setDate(e.target.value)} required className="w-full p-2 border border-gray-300 rounded" />
          </div>
          <button type="submit" className="bg-indigo-500 text-white p-2 rounded hover:bg-blue-700">{editingPaymentId ? 'Update Payment' : 'Add Payment'}</button>
          {editingPaymentId && <button type="button" onClick={resetPaymentForm} className="bg-gray-500 text-white p-2 rounded ml-2 hover:bg-gray-700">Cancel</button>}
        </form>
        <form onSubmit={editingLessonId ? handleUpdateLesson : handleAddLesson} className="bg-white p-5 rounded shadow-md">
          <h3 className="text-xl font-semibold mb-3">{editingLessonId ? 'Edit Lesson' : 'Add Lesson'}</h3>
          <div className="mb-3">
            <label htmlFor="lessonDescription" className="block mb-1">Lesson Description:</label>
            <input type="text" id="lessonDescription" value={lessonDescription} onChange={(e) => setLessonDescription(e.target.value)} className="w-full p-2 border border-gray-300 rounded" />
          </div>
          <div className="mb-3">
            <label htmlFor="lessonDate" className="block mb-1">Lesson Date:</label>
            <input type="date" id="lessonDate" value={lessonDate} onChange={(e) => setLessonDate(e.target.value)} required className="w-full p-2 border border-gray-300 rounded" />
          </div>
          <div className="mb-3">
            <label htmlFor="selectedSubject" className="block mb-1">Subject:</label>
            <select id="selectedSubject" value={selectedSubject} onChange={(e) => setSelectedSubject(e.target.value)} required className="w-full p-2 border border-gray-300 rounded">
              <option value="English">English</option>
              <option value="IT">IT</option>
            </select>
          </div>
          <button type="submit" className="bg-indigo-500 text-white p-2 rounded hover:bg-blue-700">{editingLessonId ? 'Update Lesson' : 'Add Lesson'}</button>
          {editingLessonId && <button type="button" onClick={resetLessonForm} className="bg-gray-500 text-white p-2 rounded ml-2 hover:bg-gray-700">Cancel</button>}
        </form>
      </div>
      <div className="mb-5">
        <label htmlFor="filter" className="block mb-1">Filter Transactions:</label>
        <select value={filter} onChange={(e) => setFilter(e.target.value)} className="w-full p-2 border border-gray-300 rounded">
          <option value="All">All Transactions</option>
          <option value="Payments">Payments</option>
          <option value="Lessons">Completed Lessons</option>
        </select>
      </div>
      <div className="mb-5">
        <label htmlFor="displayCurrency" className="block mb-1">Display Currency:</label>
        <select value={displayCurrency} onChange={(e) => setDisplayCurrency(e.target.value)} className="w-full p-2 border border-gray-300 rounded">
          {currencies.map(curr => (
            <option key={curr} value={curr}>{curr}</option>
          ))}
        </select>
      </div>
      <div className="mb-5">
        <h3 className="text-lg font-bold">Payments</h3>
        <ul className="list-none p-0">
          {payments.map(transaction => (
            <li key={transaction.id} className="bg-gray-100 border border-gray-300 rounded p-3 mb-3 relative">
              <span className="block mb-2 cursor-pointer text-lg font-medium">
                <span className="block text-black-600">Payment of {transaction.amount.toFixed(2)} {transaction.currency} on {transaction.date}</span>
              </span>
              <div className="absolute right-2 top-2">
                <button onClick={() => handleEditPayment(transaction.id)} className="bg-indigo-500 text-white p-2 rounded hover:bg-blue-700">Edit</button>
                <button onClick={() => handleRemoveTransaction(transaction.id)} className="bg-gray-500 text-white p-2 rounded ml-2 hover:bg-red-700">Remove</button>
              </div>
            </li>
          ))}
        </ul>
      </div>
      <div className="mb-5">
        <h3 className="text-lg font-bold">Completed Lessons</h3>
        <div className="mb-3">
          <h4 className="text-md font-bold">English</h4>
          <ul className="list-none p-0">
            {englishLessons.map(transaction => (
              <li key={transaction.id} className="bg-gray-100 border border-gray-300 rounded p-3 mb-3 relative">
                <span className="block mb-2 cursor-pointer text-lg font-medium">
                  <span className="block text-black-600">{transaction.description} on {transaction.date}</span>
                </span>
                <div className="absolute right-2 top-2">
                  <button onClick={() => handleEditLesson(transaction.id)} className="bg-indigo-500 text-white p-2 rounded hover:bg-blue-700">Edit</button>
                  <button onClick={() => handleRemoveTransaction(transaction.id)} className="bg-gray-500 text-white p-2 rounded ml-2 hover:bg-red-700">Remove</button>
                </div>
              </li>
            ))}
          </ul>
        </div>
        <div className="mb-3">
          <h4 className="text-md font-bold">IT</h4>
          <ul className="list-none p-0">
            {itLessons.map(transaction => (
              <li key={transaction.id} className="bg-gray-100 border border-gray-300 rounded p-3 mb-3 relative">
                <span className="block mb-2 cursor-pointer text-lg font-medium">
                  <span className="block text-blue-600">{transaction.description} on {transaction.date}</span>
                </span>
                <div className="absolute right-2 top-2">
                  <button onClick={() => handleEditLesson(transaction.id)} className="bg-blue-500 text-white p-2 rounded hover:bg-blue-700">Edit</button>
                  <button onClick={() => handleRemoveTransaction(transaction.id)} className="bg-gray-500 text-white p-2 rounded ml-2 hover:bg-gray-700">Remove</button>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
   
    </div>
  );
};

export default StudentPage;