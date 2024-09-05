import React, { useState, useEffect, useContext } from 'react';
import { useParams } from 'react-router-dom';
import { Pie } from 'react-chartjs-2';
import { GlobalStateContext } from '../context/GlobalStateContext';
import 'chart.js/auto';
import '../styles/StudentPage.css';
import { db } from '../firebase';
import { collection, addDoc, getDocs, deleteDoc, doc, updateDoc } from 'firebase/firestore';

const StudentPage = () => {
  const { students, transactions, setTransactions } = useContext(GlobalStateContext);
  const { id } = useParams();
  const [student, setStudent] = useState(null);
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState('');
  const [lessonDescription, setLessonDescription] = useState('');
  const [lessonDate, setLessonDate] = useState(new Date().toISOString().slice(0, 10));
  const [selectedSubject, setSelectedSubject] = useState('English');
  const [lessonsPurchased, setLessonsPurchased] = useState(0);
  const [lessonsCompleted, setLessonsCompleted] = useState(0);
  const [editingPaymentId, setEditingPaymentId] = useState(null);
  const [editingLessonId, setEditingLessonId] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    const foundStudent = students.find(s => s.id === id);
    setStudent(foundStudent);
    if (foundStudent) {
      const studentTransactions = transactions.filter(t => t.category === foundStudent.name);
      const totalAmount = studentTransactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
      setLessonsPurchased(totalAmount / foundStudent.price);
      setLessonsCompleted(studentTransactions.filter(t => t.type === 'lesson').length);
    }

    const fetchTransactions = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, 'transactions'));
        const items = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setTransactions(items);
      } catch (error) {
        setError("Error fetching transactions");
      }
    };

    fetchTransactions();
  }, [id, students, transactions, setTransactions]);

  const handleAddPayment = async (e) => {
    e.preventDefault();
    if (amount && date && student) {
      setError(null);
      const newTransaction = { type: 'income', category: student.name, amount: parseFloat(amount), date };
      try {
        const docRef = await addDoc(collection(db, 'transactions'), newTransaction);
        setTransactions([...transactions, { id: docRef.id, ...newTransaction }]);
        resetPaymentForm();
      } catch (error) {
        setError("Error adding payment");
      }
    } else {
      setError("Please fill out all fields");
    }
  };

  const handleAddLesson = async (e) => {
    e.preventDefault();
    if (lessonDescription && selectedSubject && student) {
      setError(null);
      const newLesson = { type: 'lesson', category: student.name, description: lessonDescription, date: lessonDate, subject: selectedSubject };
      try {
        const docRef = await addDoc(collection(db, 'transactions'), newLesson);
        setTransactions([...transactions, { id: docRef.id, ...newLesson }]);
        resetLessonForm();
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
    setEditingPaymentId(id);
    setAmount(payment.amount);
    setDate(payment.date);
  };

  const handleEditLesson = (id) => {
    const lesson = transactions.find(transaction => transaction.id === id);
    setEditingLessonId(id);
    setLessonDescription(lesson.description);
    setLessonDate(lesson.date);
    setSelectedSubject(lesson.subject);
  };

  const handleUpdatePayment = async (e) => {
    e.preventDefault();
    setError(null);
    try {
      const transactionDoc = doc(db, 'transactions', editingPaymentId);
      await updateDoc(transactionDoc, { amount: parseFloat(amount), date });
      setTransactions(transactions.map(transaction => transaction.id === editingPaymentId ? { ...transaction, amount: parseFloat(amount), date } : transaction));
      resetPaymentForm();
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
    } catch (error) {
      setError("Error updating lesson");
    }
  };

  const resetPaymentForm = () => {
    setEditingPaymentId(null);
    setAmount('');
    setDate('');
  };

  const resetLessonForm = () => {
    setEditingLessonId(null);
    setLessonDescription('');
    setLessonDate(new Date().toISOString().slice(0, 10));
    setSelectedSubject('English');
  };

  if (!student) {
    return <div>Student not found</div>;
  }

  const filteredTransactions = transactions.filter(transaction => transaction.category === student.name);
  const payments = filteredTransactions.filter(transaction => transaction.type === 'income');
  const lessons = filteredTransactions.filter(transaction => transaction.type === 'lesson');

  const pieData = {
    labels: ['Purchased Lessons', 'Completed Lessons'],
    datasets: [{ data: [lessonsPurchased, lessonsCompleted], backgroundColor: ['#4caf50', '#ff9800'] }],
  };

  return (
    <div className="student-page">
      <h2>{student.name}</h2>
      {error && <p className="error-message">{error}</p>}
      <div className="chart-container">
        <Pie data={pieData} />
      </div>
      <div className="forms-container">
        <form onSubmit={editingPaymentId ? handleUpdatePayment : handleAddPayment}>
          <h3>{editingPaymentId ? 'Edit Payment' : 'Add Payment'}</h3>
          <div>
            <label htmlFor="amount">Amount:</label>
            <input type="number" id="amount" value={amount} onChange={(e) => setAmount(e.target.value)} required />
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
            <input type="text" id="lessonDescription" value={lessonDescription} onChange={(e) => setLessonDescription(e.target.value)} required />
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
      <div className="transactions-list">
        <h3>Payments</h3>
        <ul>
          {payments.map(payment => (
            <li key={payment.id} className="transaction-item">
              Payment of {payment.amount} on {payment.date}
              <div className="button-group">
                <button onClick={() => handleEditPayment(payment.id)}>Edit</button>
                <button onClick={() => handleRemoveTransaction(payment.id)} className="remove-button">Remove</button>
              </div>
            </li>
          ))}
        </ul>
        <h3>Completed Lessons</h3>
        <h4>English</h4>
        <ul>
          {lessons.filter(lesson => lesson.subject === 'English').map(lesson => (
            <li key={lesson.id} className="transaction-item">
              {lesson.description} on {lesson.date}
              <div className="button-group">
                <button onClick={() => handleEditLesson(lesson.id)}>Edit</button>
                <button onClick={() => handleRemoveTransaction(lesson.id)} className="remove-button">Remove</button>
              </div>
            </li>
          ))}
        </ul>
        <h4>IT</h4>
        <ul>
          {lessons.filter(lesson => lesson.subject === 'IT').map(lesson => (
            <li key={lesson.id} className="transaction-item">
              {lesson.description} on {lesson.date}
              <div className="button-group">
                <button onClick={() => handleEditLesson(lesson.id)}>Edit</button>
                <button onClick={() => handleRemoveTransaction(lesson.id)} className="remove-button">Remove</button>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default StudentPage;
