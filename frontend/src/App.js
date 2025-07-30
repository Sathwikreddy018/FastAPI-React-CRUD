// fullstack-app/frontend/src/App.js

// IMPORTANT: These are the imports that fix your 'useState' and 'useEffect' errors.
// They must be at the very top of your file.
import React, { useState, useEffect } from 'react';
import './App.css'; // Import App.css for basic styling

function App() {
  // State variables to hold data
  const [items, setItems] = useState([]); // Stores the list of items
  const [newItemName, setNewItemName] = useState(''); // For the new item input name
  const [newItemDescription, setNewItemDescription] = useState(''); // For the new item input description
  // State for update functionality (will be used later for PUT)
  const [editingItemId, setEditingItemId] = useState(null);
  const [editingItemName, setEditingItemName] = useState('');
  const [editingItemDescription, setEditingItemDescription] = useState('');
  const [editingItemCompleted, setEditingItemCompleted] = useState(false);


  // -------------------------------------------------------------
  // API Interaction Functions
  // -------------------------------------------------------------

  // Function to fetch all items from the backend (GET)
  const fetchItems = async () => {
    try {
      const response = await fetch('http://localhost:8000/items/'); // Make GET request
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json(); // Parse JSON response
      setItems(data); // Update React state
    } catch (error) {
      console.error("Error fetching items:", error);
      // In a real app, you might set an error message state here to show to the user
    }
  };

  // Function to add a new item to the backend (POST)
  const addItem = async (e) => {
    e.preventDefault(); // Prevent default form submission (page reload)

    const newItemData = {
      name: newItemName,
      description: newItemDescription,
      completed: false // New items are typically not completed initially
    };

    try {
      const response = await fetch('http://localhost:8000/items/', {
        method: 'POST', // Specify HTTP POST method
        headers: {
          'Content-Type': 'application/json', // Tell server we're sending JSON
        },
        body: JSON.stringify(newItemData), // Convert JS object to JSON string
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const createdItem = await response.json(); // Get the item returned by FastAPI (with ID)

      // Update the `items` state by adding the newly created item
      // Using spread operator `...items` creates a new array with existing items,
      // and then adds `createdItem` to the end. This is crucial for React to detect changes.
      setItems((prevItems) => [...prevItems, createdItem]);

      // Clear the form fields
      setNewItemName('');
      setNewItemDescription('');

    } catch (error) {
      console.error("Error adding item:", error);
    }
  };

  // Function to delete an item (DELETE)
  const deleteItem = async (id) => {
    try {
      const response = await fetch(`http://localhost:8000/items/${id}`, {
        method: 'DELETE', // Specify HTTP DELETE method
      });

      if (!response.ok) {
        // FastAPI returns 404 if not found, or other errors
        const errorData = await response.json();
        throw new Error(`HTTP error! status: ${response.status}: ${errorData.detail}`);
      }

      // If successful, remove the item from the local state to update UI
      setItems((prevItems) => prevItems.filter(item => item.id !== id));
      console.log(`Item with ID ${id} deleted successfully.`);

    } catch (error) {
      console.error("Error deleting item:", error);
    }
  };

  // Function to start editing an item
  const startEditing = (item) => {
    setEditingItemId(item.id);
    setEditingItemName(item.name);
    setEditingItemDescription(item.description || ''); // Handle null description
    setEditingItemCompleted(item.completed);
  };

  // Function to cancel editing
  const cancelEditing = () => {
    setEditingItemId(null);
    setEditingItemName('');
    setEditingItemDescription('');
    setEditingItemCompleted(false);
  };

  // Function to update an item (PUT)
  const updateItem = async (e) => {
    e.preventDefault();

    if (!editingItemId) return; // Should not happen if edit flow is correct

    const updatedItemData = {
      name: editingItemName,
      description: editingItemDescription,
      completed: editingItemCompleted
    };

    try {
      const response = await fetch(`http://localhost:8000/items/${editingItemId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updatedItemData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`HTTP error! status: ${response.status}: ${errorData.detail}`);
      }

      const returnedUpdatedItem = await response.json();

      // Update the items array in state with the modified item
      setItems((prevItems) =>
        prevItems.map((item) =>
          item.id === editingItemId ? returnedUpdatedItem : item
        )
      );

      cancelEditing(); // Exit editing mode
      console.log(`Item with ID ${editingItemId} updated successfully.`);

    } catch (error) {
      console.error("Error updating item:", error);
    }
  };


  // -------------------------------------------------------------
  // useEffect Hook for initial data fetching
  // -------------------------------------------------------------
  useEffect(() => {
    fetchItems(); // Call fetchItems when the component mounts
  }, []); // Empty dependency array means this effect runs only once

  // -------------------------------------------------------------
  // Render JSX
  // -------------------------------------------------------------
  return (
    <div className="App">
      <header className="App-header">
        <h1>My Fullstack Items App</h1>
      </header>
      <main>
        {/* Form to add new items */}
        <section className="item-form">
          <h2>Add New Item</h2>
          <form onSubmit={addItem}>
            <input
              type="text"
              placeholder="Item Name"
              value={newItemName}
              onChange={(e) => setNewItemName(e.target.value)}
              required
            />
            <input
              type="text"
              placeholder="Description (Optional)"
              value={newItemDescription}
              onChange={(e) => setNewItemDescription(e.target.value)}
            />
            <button type="submit">Add Item</button>
          </form>
        </section>

        {/* Form to edit existing item (conditionally rendered) */}
        {editingItemId && (
          <section className="item-form edit-form">
            <h2>Edit Item (ID: {editingItemId})</h2>
            <form onSubmit={updateItem}>
              <input
                type="text"
                placeholder="Item Name"
                value={editingItemName}
                onChange={(e) => setEditingItemName(e.target.value)}
                required
              />
              <input
                type="text"
                placeholder="Description (Optional)"
                value={editingItemDescription}
                onChange={(e) => setEditingItemDescription(e.target.value)}
              />
              <label>
                <input
                  type="checkbox"
                  checked={editingItemCompleted}
                  onChange={(e) => setEditingItemCompleted(e.target.checked)}
                />
                Completed
              </label>
              <button type="submit">Update Item</button>
              <button type="button" onClick={cancelEditing} style={{ marginLeft: '10px', backgroundColor: '#6c757d' }}>Cancel</button>
            </form>
          </section>
        )}


        {/* List to display items */}
        <section className="item-list">
          <h2>Current Items</h2>
          {items.length === 0 ? (
            <p>No items yet. Add some above!</p>
          ) : (
            <ul>
              {items.map((item) => (
                <li key={item.id}>
                  <div>
                    <strong>{item.name}</strong>
                    {item.description && <span> - {item.description}</span>}
                    {item.completed ? (
                      <span style={{ marginLeft: '10px', color: 'green' }}> (Completed)</span>
                    ) : (
                      <span style={{ marginLeft: '10px', color: 'orange' }}> (Pending)</span>
                    )}
                  </div>
                  <div>
                    <button onClick={() => startEditing(item)} style={{ marginRight: '5px', backgroundColor: '#ffc107', color: 'white' }}>Edit</button>
                    <button onClick={() => deleteItem(item.id)} style={{ backgroundColor: '#dc3545', color: 'white' }}>Delete</button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </main>
    </div>
  );
}

export default App;