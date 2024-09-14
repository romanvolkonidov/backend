import React, { useState, useEffect, useContext, useRef } from 'react';
import { Link } from 'react-router-dom';
import { GlobalStateContext } from '../context/GlobalStateContext'; // Adjust the path as necessary
import { db } from '../firebase'; // Adjust the import path as necessary
import { collection, addDoc, getDocs, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import 'tailwindcss/tailwind.css';

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
    <div className="max-w-5xl mx-auto p-5 font-sans text-gray-800">
      <h2 className="text-center text-blue-500 mb-5 text-2xl font-bold">Student Management</h2>
      <form ref={formRef} onSubmit={editingStudentId ? handleUpdateStudent : handleAddStudent} className="space-y-4">
        {/* Student Name */}
        <div>
          <label htmlFor="studentName" className="block text-sm font-medium text-gray-700">Student Name</label>
          <input
            type="text"
            id="studentName"
            name="studentName"
            value={studentName}
            onChange={(e) => setStudentName(e.target.value)}
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
          />
        </div>

        {/* Subjects */}
        <div>
          <label className="block text-sm font-medium text-gray-700">Subjects</label>
          <div className="space-y-2">
            {/* English Checkbox */}
            <div className="flex items-center">
              <input
                type="checkbox"
                id="english"
                name="English"
                checked={subjects.English}
                onChange={() => handleSubjectChange('English')}
                className="h-4 w-4 text-indigo-600 border-gray-300 rounded"
              />
              <label htmlFor="english" className="ml-2 block text-sm text-gray-900">English</label>
            </div>

            {/* IT Checkbox */}
            <div className="flex items-center">
              <input
                type="checkbox"
                id="it"
                name="IT"
                checked={subjects.IT}
                onChange={() => handleSubjectChange('IT')}
                className="h-4 w-4 text-indigo-600 border-gray-300 rounded"
              />
              <label htmlFor="it" className="ml-2 block text-sm text-gray-900">IT</label>
            </div>
          </div>
        </div>

        {/* Price */}
        <div>
          <label htmlFor="price" className="block text-sm font-medium text-gray-700">Price</label>
          <div className="flex space-x-2">
            <input
              type="number"
              id="price"
              name="price"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            />
            <select
              id="currency"
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            >
              {currencies.filter(curr => curr !== 'respective').map(curr => (
                <option key={curr} value={curr}>{curr}</option>
              ))}
            </select>
          </div>
        </div>
          
          
        {/* Submit Buttons */}
        <div className="flex space-x-2">
          <button type="submit" className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
            {editingStudentId ? 'Update Student' : 'Add Student'}
          </button>
          {editingStudentId && (
            <button type="button" onClick={() => setEditingStudentId(null)} className="inline-flex justify-center py-2 px-4 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
              Cancel
            </button>
          )}
        </div>
      </form>

      {/* Error and Loading States */}
      {loading && <p className="text-blue-500">Loading...</p>}
      {error && <p className="text-red-500">{error}</p>}

      {/* Student List */}
      <div className="mt-8">
        <h3 className="text-xl font-semibold mb-4">Student List</h3>
        <div className="mb-4">
          <label htmlFor="selectedCurrency" className="block text-sm font-medium text-gray-700">Display Currency:</label>
          <select
            id="selectedCurrency"
            value={selectedCurrency}
            onChange={(e) => setSelectedCurrency(e.target.value)}
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
          >
            {currencies.map(curr => (
              <option key={curr} value={curr}>{curr}</option>
            ))}
          </select>
        </div>
        <div className="mb-4">
          <label htmlFor="searchTerm" className="block text-sm font-medium text-gray-700">Search Student:</label>
          <input
            type="text"
            id="searchTerm"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
          />
        </div>
        <ul className="space-y-4">
          {filteredStudents.map((student, index) => (
            <li key={student.id} className="bg-gray-100 border border-gray-300 rounded p-3 mb-3 relative">
              {editingStudentId === student.id ? (
                <>
                  <input
                    type="text"
                    defaultValue={student.name}
                    onBlur={(e) => handleUpdateStudent({
                      ...student,
                      name: e.target.value
                    })}
                    className="w-1/2 inline-block mr-2"
                  />
                  <input
                    type="number"
                    defaultValue={student.price}
                    onBlur={(e) => handleUpdateStudent({
                      ...student,
                      price: parseFloat(e.target.value)
                    })}
                    className="w-1/2 inline-block"
                  />
                  <button onClick={() => setEditingStudentId(null)} className="bg-blue-500 text-white p-2 rounded ml-2 hover:bg-blue-700">Cancel</button>
                  <button onClick={() => handleUpdateStudent(student)} className="bg-blue-500 text-white p-2 rounded ml-2 hover:bg-blue-700">Update</button>
                </>
              ) : (
                <>
                  <Link to={`/student/${student.id}`} className="block mb-2 cursor-pointer text-lg font-medium">
                    <span className="block text-blue-600">{student.name}</span>
                    <span className="block text-gray-700">
                      {convertToSelectedCurrency(student.price, student.currency).toFixed(2)} {selectedCurrency === 'respective' ? student.currency : selectedCurrency}
                    </span>
                  </Link>
                  <div className="absolute right-2 top-2">
                    <button onClick={() => handleRemoveStudent(student.id)} className="bg-gray-500 text-white p-2 rounded hover:bg-red-700">Remove</button>
                  </div>
                </>
              )}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default StudentManagement;