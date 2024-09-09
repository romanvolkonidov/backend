import React, { useEffect, useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { GlobalStateContext } from '../context/GlobalStateContext';
import '../styles/EventsPage.css'; // Import the CSS file
import { collection, addDoc } from 'firebase/firestore';
import { db } from '../firebase';

const EventsPage = () => {
  const { students, transactions, setTransactions } = useContext(GlobalStateContext);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showLessonForm, setShowLessonForm] = useState(false);
  const [lessonDescription, setLessonDescription] = useState('');
  const [lessonDate, setLessonDate] = useState(new Date().toISOString().slice(0, 10));
  const [selectedSubject, setSelectedSubject] = useState('English');
  const [popupMessage, setPopupMessage] = useState('');
  const [showPopup, setShowPopup] = useState(false);
  const [currentStudents, setCurrentStudents] = useState([]);
  const [currentStudentIndex, setCurrentStudentIndex] = useState(0);
  const [fadeIn, setFadeIn] = useState(false); // State to trigger fade-in animation
  const navigate = useNavigate();

  useEffect(() => {
    const fetchEvents = async () => {
      setLoading(true);
      setError(null);
      try {
        console.log('Fetching events from API...');
        const response = await fetch('https://test-il25.onrender.com/events');
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const eventsData = await response.json();
        console.log('Events data fetched:', eventsData);
        const formattedEvents = Object.values(eventsData).flat();
        setEvents(formattedEvents);
      } catch (err) {
        setError('Error fetching events');
        console.error('Error fetching events:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchEvents();
  }, []);

  const handleAddLessonClick = (eventSummary, eventStart) => {
    const studentsInEvent = students.filter((student) => eventSummary.includes(student.name));
    if (studentsInEvent.length > 0) {
      setCurrentStudents(studentsInEvent);
      setLessonDescription(eventSummary);
      setLessonDate(eventStart);
      setSelectedSubject('English'); // You can adjust this as needed
      setCurrentStudentIndex(0);
      setShowLessonForm(true);
      setFadeIn(true); // Trigger fade-in animation
    }
  };

  const handleAddLesson = async (e) => {
    e.preventDefault();
    const currentStudent = currentStudents[currentStudentIndex];
    if (selectedSubject && currentStudent) {
      const newLesson = {
        type: 'lesson',
        category: currentStudent.name,
        description: lessonDescription,
        date: lessonDate,
        subject: selectedSubject,
      };
      try {
        const docRef = await addDoc(collection(db, 'transactions'), newLesson);
        const updatedTransactions = [...transactions, { id: docRef.id, ...newLesson }];
        setTransactions(updatedTransactions); // Update global state
        setPopupMessage(`Lesson for ${currentStudent.name} added successfully!`);
        setShowPopup(true);
        setTimeout(() => {
          setShowPopup(false);
          if (currentStudentIndex < currentStudents.length - 1) {
            setCurrentStudentIndex(currentStudentIndex + 1);
            setFadeIn(true); // Trigger fade-in animation for next student
          } else {
            setShowLessonForm(false);
          }
        }, 3000);
      } catch (error) {
        setError('Error adding lesson');
      }
    } else {
      setError('Please fill out all fields');
    }
  };

  const resetLessonForm = () => {
    setLessonDescription('');
    setLessonDate(new Date().toISOString().slice(0, 10));
    setSelectedSubject('English');
  };

  return (
    <div className="container">
      <h1>Today's Lessons</h1>
      {loading && <p>Loading...</p>}
      {error && <p style={{ color: 'red' }}>{error}</p>}
      {showPopup && <div className="popup">{popupMessage}</div>}
      <ul>
        {events.map((event, index) => {
          const studentsInEvent = students.filter((student) => event.summary.includes(student.name));
          return (
            <li key={index} className="calendar-event">
              {event.summary} - {new Date(event.start).toLocaleTimeString()} to {new Date(event.end).toLocaleTimeString()}
              {studentsInEvent.length > 0 && (
                <button onClick={() => handleAddLessonClick(event.summary, event.start)}>Add Lesson</button>
              )}
            </li>
          );
        })}
      </ul>
      {showLessonForm && (
        <form onSubmit={handleAddLesson} className={fadeIn ? 'fade-in' : ''} onAnimationEnd={() => setFadeIn(false)}>
          <h2>Add Lesson for {currentStudents[currentStudentIndex].name}</h2>
          <div>
            <label>Description:</label>
            <input type="text" value={lessonDescription} onChange={(e) => setLessonDescription(e.target.value)} />
          </div>
          <div>
            <label>Date:</label>
            <input type="date" value={lessonDate} onChange={(e) => setLessonDate(e.target.value)} />
          </div>
          <div>
            <label>Subject:</label>
            <select value={selectedSubject} onChange={(e) => setSelectedSubject(e.target.value)}>
              <option value="English">English</option>
              <option value="Math">Math</option>
              <option value="Science">Science</option>
              {/* Add more subjects as needed */}
            </select>
          </div>
          <button type="submit">Add Lesson</button>
        </form>
      )}
    </div>
  );
};

export default EventsPage;
