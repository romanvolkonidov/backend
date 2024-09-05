import React, { useState, useEffect, useContext } from 'react';
import { Link } from 'react-router-dom';
import { GlobalStateContext } from '../context/GlobalStateContext'; // Adjust the path as necessary
import '../styles/StudentManagement.css';
import { db } from '../firebase'; // Adjust the import path as necessary
import { collection, addDoc, getDocs, deleteDoc, doc, updateDoc } from 'firebase/firestore';

const StudentManagement = () => {
  const { students, setStudents, transactions, setTransactions } = useContext(GlobalStateContext);
  const [studentName, setStudentName] = useState('');
  const [subjects, setSubjects] = useState({ English: false, IT: false });
  const [price, setPrice] = useState('');
  const [editingStudentId, setEditingStudentId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const querySnapshot = await getDocs(collection(db, 'students'));
        const items = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setStudents(items);
      } catch (error) {
        setError("Error fetching student data");
        console.error("Error fetching Firestore data: ", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [setStudents]);

  const handleAddStudent = async (e) => {
    e.preventDefault();
    if (studentName && price) {
      setLoading(true);
      setError(null);
      const newStudent = {
        name: studentName,
        subjects: subjects,
        price: parseFloat(price),
      };
      try {
        const docRef = await addDoc(collection(db, 'students'), newStudent);
        setStudents([...students, { id: docRef.id, ...newStudent }]);
        setStudentName('');
        setSubjects({ English: false, IT: false });
        setPrice('');
      } catch (error) {
        setError("Error adding student");
        console.error("Error adding document: ", error);
      } finally {
        setLoading(false);
      }
    } else {
      setError("Please fill out all fields");
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
      console.error("Error removing document: ", error);
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
  };

  const handleUpdateStudent = async (e) => {
    e.preventDefault();
    if (studentName && price) {
      setLoading(true);
      setError(null);
      try {
        const studentDoc = doc(db, 'students', editingStudentId);
        await updateDoc(studentDoc, {
          name: studentName,
          subjects: subjects,
          price: parseFloat(price),
        });
        const updatedStudents = students.map(student =>
          student.id === editingStudentId
            ? { ...student, name: studentName, subjects: subjects, price: parseFloat(price) }
            : student
        );
        setStudents(updatedStudents);
        setEditingStudentId(null);
        setStudentName('');
        setSubjects({ English: false, IT: false });
        setPrice('');
      } catch (error) {
        setError("Error updating student");
        console.error("Error updating document: ", error);
      } finally {
        setLoading(false);
      }
    } else {
      setError("Please fill out all fields");
    }
  };

  return (
    <div className="student-management">
      <h2>Student Management</h2>
      <form onSubmit={editingStudentId ? handleUpdateStudent : handleAddStudent}>
        {/* Student Name */}
        <div>
          <label htmlFor="studentName">Student Name</label>
          <input
            type="text"
            id="studentName"
            name="studentName"
            value={studentName}
            onChange={(e) => setStudentName(e.target.value)}
            required
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
          <label htmlFor="price">Price (KSH)</label>
          <input
            type="number"
            id="price"
            name="price"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            required
          />
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
        <ul>
          {students.map((student) => (
            <li key={student.id} className="transaction-item">
              <Link to={`/student/${student.id}`}>{student.name}</Link>
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
