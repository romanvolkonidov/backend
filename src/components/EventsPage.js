import React, { useEffect, useState, useRef, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, addDoc } from 'firebase/firestore';
import { db } from '../firebase';

const EventsPage = () => {
  const [students, setStudents] = useState([]); // Assuming students are fetched or passed as props
  const [transactions, setTransactions] = useState([]); // Assuming transactions are fetched or passed as props
  const [events, setEvents] = useState(() => {
    const storedEvents = localStorage.getItem('events');
    return storedEvents ? JSON.parse(storedEvents) : {};
  }); // Initialize from localStorage if available
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
  const [fadeOut, setFadeOut] = useState(false); // State to trigger fade-out animation
  const navigate = useNavigate();
  const formRef = useRef(null); // Reference to the form element

  const fetchEvents = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const storedEvents = localStorage.getItem('events');
      const storedFetchTime = localStorage.getItem('eventsFetchTime');
      const now = Date.now();

      if (storedEvents && storedFetchTime && now - storedFetchTime < 2 * 60 * 1000) {
        setEvents(JSON.parse(storedEvents));
      } else {
        const response = await fetch('https://node1-wjn7-git-main-romans-projects-fb0eaccb.vercel.app/api/events');
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const eventsData = await response.json();
        setEvents(eventsData);
        localStorage.setItem('events', JSON.stringify(eventsData));
        localStorage.setItem('eventsFetchTime', now.toString());
      }
    } catch (err) {
      setError('Error fetching events');
      console.error('Error fetching events:', err);
      setEvents({});
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchEvents();
    const intervalId = setInterval(fetchEvents, 2 * 60 * 1000);
    return () => clearInterval(intervalId);
  }, [fetchEvents]);

  useEffect(() => {
    if (showLessonForm && formRef.current) {
      formRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [showLessonForm]);

  const handleAddLessonClick = (eventSummary, eventStart) => {
    const studentsInEvent = students.filter((student) => {
      const studentNames = student.name.split(' ');
      return studentNames.some(namePart => eventSummary.includes(namePart));
    });
    if (studentsInEvent.length > 0) {
      setCurrentStudents(studentsInEvent);
      setLessonDescription(eventSummary);
      setLessonDate(new Date(eventStart).toISOString().slice(0, 10)); // Ensure correct date format
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
            setFadeOut(true); // Trigger fade-out animation
            setTimeout(() => {
              setCurrentStudentIndex(currentStudentIndex + 1);
              setFadeIn(true); // Trigger fade-in animation for next student
              setFadeOut(false); // Reset fade-out state
            }, 1000); // Match the duration of the fade-out animation
          } else {
            setFadeOut(true); // Trigger fade-out animation
            setTimeout(() => {
              setShowLessonForm(false);
              setFadeOut(false); // Reset fade-out state
              window.scrollTo({ top: 0, behavior: 'smooth' }); // Scroll back to the top
            }, 1000); // Match the duration of the fade-out animation
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

  const sortedAndFilteredEvents = useMemo(() => {
    return Object.entries(events)
      .flatMap(([eventKey, eventArray]) => eventArray)
      .sort((a, b) => new Date(a.start) - new Date(b.start))
      .filter((event, index, self) =>
        index === self.findIndex((e) => e.summary === event.summary && e.start === e.start)
      );
  }, [events]);

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Today's Lessons</h1>
      {loading && <p>Loading...</p>}
      {error && <p className="text-red-500">{error}</p>}
      {showPopup && <div className="popup bg-green-500 text-white p-2 rounded">{popupMessage}</div>}
      <ul>
        {sortedAndFilteredEvents.length > 0 ? (
          sortedAndFilteredEvents.map((event, index) => {
            const studentsInEvent = students.filter((student) => {
              const studentNames = student.name.split(' ');
              return studentNames.some(namePart => event.summary.includes(namePart));
            });
            return (
              <li key={index} className="calendar-event mb-2 p-2 border rounded">
                {event.summary} - {new Date(event.start).toLocaleTimeString()} to {new Date(event.end).toLocaleTimeString()}
                {studentsInEvent.length > 0 && (
                  <button className="ml-2 bg-blue-500 text-white px-2 py-1 rounded" onClick={() => handleAddLessonClick(event.summary, event.start)}>Add Lesson</button>
                )}
              </li>
            );
          })
        ) : (
          <p>No events available</p>
        )}
      </ul>
      {showLessonForm && (
        <form
          ref={formRef}
          onSubmit={handleAddLesson}
          className={`mt-4 p-4 border rounded ${fadeIn ? 'fade-in' : ''} ${fadeOut ? 'fade-out' : ''}`}
          onAnimationEnd={() => {
            if (fadeOut) {
              setFadeOut(false); // Reset fade-out state after animation ends
            }
          }}
        >
          <h2 className="text-xl font-bold mb-2">Add Lesson for {currentStudents[currentStudentIndex]?.name}</h2>
          <div className="mb-2">
            <label className="block mb-1">Description:</label>
            <input className="w-full p-2 border rounded" type="text" value={lessonDescription} onChange={(e) => setLessonDescription(e.target.value)} />
          </div>
          <div className="mb-2">
            <label className="block mb-1">Date:</label>
            <input className="w-full p-2 border rounded" type="date" value={lessonDate} onChange={(e) => setLessonDate(e.target.value)} />
          </div>
          <div className="mb-2">
            <label className="block mb-1">Subject:</label>
            <select className="w-full p-2 border rounded" value={selectedSubject} onChange={(e) => setSelectedSubject(e.target.value)}>
              <option value="English">English</option>
              <option value="Math">Math</option>
              <option value="Science">Science</option>
              {/* Add more subjects as needed */}
            </select>
          </div>
          <button className="bg-green-500 text-white px-4 py-2 rounded" type="submit">Add Lesson</button>
        </form>
      )}
    </div>
  );
};

export default EventsPage;