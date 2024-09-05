import React, { useState, useEffect } from 'react';
import { db } from '../firebase'; // Adjust the import path as necessary
import { collection, addDoc, getDocs } from 'firebase/firestore';

const SharedData = () => {
  const [data, setData] = useState([]);
  const [newItem, setNewItem] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const querySnapshot = await getDocs(collection(db, 'sharedData')); // Replace 'sharedData' with your actual collection name
        const items = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setData(items);
      } catch (error) {
        setError("Error fetching data");
        console.error("Error fetching Firestore data: ", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleAddItem = async () => {
    if (newItem.trim()) {
      const newItemData = { item: newItem };
      setLoading(true);
      setError(null);
      try {
        const docRef = await addDoc(collection(db, 'sharedData'), newItemData); // Replace 'sharedData' with your actual collection name
        setData(prevData => [...prevData, { id: docRef.id, ...newItemData }]);
        setNewItem('');
      } catch (error) {
        setError("Error adding item");
        console.error("Error adding document: ", error);
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <div>
      <h1>Shared Data</h1>
      {loading && <p>Loading...</p>}
      {error && <p style={{ color: 'red' }}>{error}</p>}
      <ul>
        {data.map(d => (
          <li key={d.id}>{d.item}</li>
        ))}
      </ul>
      <input
        type="text"
        value={newItem}
        onChange={(e) => setNewItem(e.target.value)}
        placeholder="Add new item"
        disabled={loading}
      />
      <button onClick={handleAddItem} disabled={loading}>
        {loading ? 'Adding...' : 'Add Item'}
      </button>
    </div>
  );
};

export default SharedData;
