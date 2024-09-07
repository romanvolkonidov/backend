import React, { useState, useEffect, useContext, useRef } from 'react';
import { Link } from 'react-router-dom';
import { GlobalStateContext } from '../context/GlobalStateContext'; // Adjust the path as necessary
import '../styles/StudentManagement.css';
import { db } from '../firebase'; // Adjust the import path as necessary
import { collection, addDoc, getDocs, deleteDoc, doc, updateDoc } from 'firebase/firestore';

const currencies = ['USD', 'RUB', 'EUR', 'KES', 'respective'];

const StudentManagement = () => {
  const { students = [], setStudents, transactions = [], setTransactions, exchangeRates = {} } = useContext(GlobalStateContext);
  const [studentName, setStudentName] = useState('');
  const [subjects, setSubjects] = useState({ English: false, IT: false });
  const [price, setPrice] = useState('');
  const [currency, setCurrency] = useState('USD');
  const [editingStudentId, setEditingStudentId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedCurrency, setSelectedCurrency] = useState('respective'); // Default to respective
  const [searchTerm, setSearchTerm] = useState('');
  const formRef = useRef(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const querySnapshot = await getDocs(collection(db, 'students'));
        const items = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        const updatedItems = items.map(item => {
          if (!item.currency) {
            item.currency = 'USD';
            updateDoc(doc(db, 'students', item.id), { currency: 'USD' });
          }
          return item;
        });
        setStudents(updatedItems);
      } catch (error) {
        setError("Error fetching student data");
        console.error("Error fetching Firestore data: ", error.message, error.stack);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [setStudents]);

  useEffect(() => {
    console.log('Exchange Rates:', exchangeRates);
  }, [exchangeRates]);

  const handleAddStudent = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const newStudent = {
      name: studentName || '',
      subjects: subjects || { English: false, IT: false },
      price: parseFloat(price) || 0,
      currency: currency || 'USD',
    };
    try {
      const docRef = await addDoc(collection(db, 'students'), newStudent);
      setStudents([...students, { id: docRef.id, ...newStudent }]);
      setStudentName('');
      setSubjects({ English: false, IT: false });
      setPrice('');
      setCurrency('USD');
    } catch (error) {
      setError("Error adding student");
      console.error("Error adding document: ", error.message, error.stack);
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveStudent = async (id) => {
    setLoading(true);
    setError(null);
    try {
      await deleteDoc(doc(db, 'students', id));
      const updatedStudents = students.filter(student => student.id !== id);
      setStudents(updatedStudents);

      const studentName = students.find(s => s.id === id)?.name;
      const updatedTransactions = transactions.filter(transaction => transaction.category !== studentName);
      setTransactions(updatedTransactions);
    } catch (error) {
      setError("Error removing student");
      console.error("Error removing document: ", error.message, error.stack);
    } finally {
      setLoading(false);
    }
  };

  const handleSubjectChange = (subject) => {
    setSubjects(prevSubjects => ({
      ...prevSubjects,
      [subject]: !prevSubjects[subject],
    }));
  };

  const handleEditStudent = (student) => {
    setEditingStudentId(student.id);
    setStudentName(student.name);
    setSubjects(student.subjects);
    setPrice(student.price);
    setCurrency(student.currency || 'USD');
    formRef.current.scrollIntoView({ behavior: 'smooth' });
  };

  const handleUpdateStudent = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const studentDoc = doc(db, 'students', editingStudentId);
      await updateDoc(studentDoc, {
        name: studentName || '',
        subjects: subjects || { English: false, IT: false },
        price: parseFloat(price) || 0,
        currency: currency || 'USD',
      });
      const updatedStudents = students.map(student =>
        student.id === editingStudentId
          ? { ...student, name: studentName, subjects: subjects, price: parseFloat(price), currency: currency }
          : student
      );
      setStudents(updatedStudents);
      setEditingStudentId(null);
      setStudentName('');
      setSubjects({ English: false, IT: false });
      setPrice('');
      setCurrency('USD');
    } catch (error) {
      setError("Error updating student");
      console.error("Error updating document: ", error.message, error.stack);
    } finally {
      setLoading(false);
    }
  };

  const convertToSelectedCurrency = (amount, currency) => {
    if (selectedCurrency === 'respective') {
      return amount;
    }
    if (!exchangeRates[currency]) {
      console.error(`Missing exchange rate for ${currency}`);
      return amount; // Return the original amount if the exchange rate is missing
    }
    if (!exchangeRates[selectedCurrency]) {
      console.error(`Missing exchange rate for ${selectedCurrency}`);
      return amount; // Return the original amount if the exchange rate is missing
    }
    const rate = exchangeRates[selectedCurrency] / exchangeRates[currency];
    return amount * rate;
  };

  const filteredStudents = students.filter(student =>
    student.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="student-management">
      <h2>Student Management</h2>
      <form ref={formRef} onSubmit={editingStudentId ? handleUpdateStudent : handleAddStudent}>
        {/* Student Name */}
        <div>
          <label htmlFor="studentName">Student Name</label>
          <input
            type="text"
            id="studentName"
            name="studentName"
            value={studentName}
            onChange={(e) => setStudentName(e.target.value)}
          />
        </div>

        {/* Subjects */}
        <div>
          <label className="subjects">Subjects</label>
          <div className="subjects-container">
            {/* English Checkbox */}
            <div className="subject-item">
              <input
                type="checkbox"
                id="english"
                name="English"
                checked={subjects.English}
                onChange={() => handleSubjectChange('English')}
              />
              <label htmlFor="english">English</label>
            </div>

            {/* IT Checkbox */}
            <div className="subject-item">
              <input
                type="checkbox"
                id="it"
                name="IT"
                checked={subjects.IT}
                onChange={() => handleSubjectChange('IT')}
              />
              <label htmlFor="it">IT</label>
            </div>
          </div>
        </div>

        {/* Price */}
        <div>
          <label htmlFor="price">Price</label>
          <input
            type="number"
            id="price"
            name="price"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
          />
          <select id="currency" value={currency} onChange={(e) => setCurrency(e.target.value)}>
            {currencies.filter(curr => curr !== 'respective').map(curr => (
              <option key={curr} value={curr}>{curr}</option>
            ))}
          </select>
        </div>

        {/* Submit Buttons */}
        <div className="button-group">
          <button type="submit">{editingStudentId ? 'Update Student' : 'Add Student'}</button>
          {editingStudentId && (
            <button type="button" onClick={() => setEditingStudentId(null)}>
              Cancel
            </button>
          )}
        </div>
      </form>

      {/* Error and Loading States */}
      {loading && <p>Loading...</p>}
      {error && <p style={{ color: 'red' }}>{error}</p>}

      {/* Student List */}
      <div className="student-list">
        <h3>Student List</h3>
        <div>
          <label htmlFor="selectedCurrency">Display Currency:</label>
          <select
            id="selectedCurrency"
            value={selectedCurrency}
            onChange={(e) => setSelectedCurrency(e.target.value)}
          >
            {currencies.map(curr => (
              <option key={curr} value={curr}>{curr}</option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="searchTerm">Search Student:</label>
          <input
            type="text"
            id="searchTerm"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <ul>
          {filteredStudents.map((student, index) => (
            <li key={student.id} className="transaction-item">
              <span>{index + 1}. </span>
              <Link to={`/student/${student.id}`}>
                {student.name} - {convertToSelectedCurrency(student.price, student.currency).toFixed(2)} {selectedCurrency === 'respective' ? student.currency : selectedCurrency}
              </Link>
              <div className="button-group">
                <button onClick={() => handleEditStudent(student)}>Edit</button>
                <button onClick={() => handleRemoveStudent(student.id)}>Remove</button>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default StudentManagement;
