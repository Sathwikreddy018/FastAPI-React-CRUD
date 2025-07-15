# backend/main.py

from fastapi import FastAPI, HTTPException # FastAPI framework, and HTTPException for errors
from fastapi.middleware.cors import CORSMiddleware # For handling Cross-Origin Resource Sharing
from pydantic import BaseModel # For defining data models
import uvicorn # To run the FastAPI server

# -------------------------------------------------------------
# 1. Initialize FastAPI Application
# -------------------------------------------------------------
app = FastAPI()

# -------------------------------------------------------------
# 2. CORS (Cross-Origin Resource Sharing) Configuration
#    CRITICAL: Allows your React frontend (on a different port/origin)
#    to make requests to your FastAPI backend.
# -------------------------------------------------------------
origins = [
    "http://localhost:3000",  # Default port for create-react-app
    # You can add other origins if your frontend runs on different ports or domains
    # e.g., "http://localhost:3001", "https://your-frontend-domain.com"
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,          # List of allowed origins
    allow_credentials=True,         # Allow cookies to be included in cross-origin requests
    allow_methods=["*"],            # Allow all HTTP methods (GET, POST, PUT, DELETE, etc.)
    allow_headers=["*"],            # Allow all HTTP headers
)

# -------------------------------------------------------------
# 3. In-Memory Database (for simplicity in a 40-min challenge)
#    In a real app, this would be a proper database (SQL, NoSQL).
# -------------------------------------------------------------
# We'll use a list of dictionaries to simulate a database.
# This data will reset every time the server restarts.
fake_db = []
next_id = 1 # To generate unique IDs for new items

# -------------------------------------------------------------
# 4. Pydantic Models for Data Validation
#    These define the structure of data for requests and responses.
# -------------------------------------------------------------
# Defines the structure of an 'Item' that will be stored
class Item(BaseModel):
    id: int
    name: str
    description: str | None = None # description is optional (can be None)
    completed: bool = False # default value is False

# Defines the structure of an 'Item' when creating a new one (id is auto-generated)
class ItemCreate(BaseModel):
    name: str
    description: str | None = None
    completed: bool = False

# -------------------------------------------------------------
# 5. API Endpoints (Routes)
#    These are the functions that respond to HTTP requests.
# -------------------------------------------------------------

# GET all items
@app.get("/items/", response_model=list[Item]) # response_model tells FastAPI what type of data to expect
async def get_items():
    return fake_db

# GET a specific item by ID
@app.get("/items/{item_id}", response_model=Item)
async def get_item(item_id: int):
    for item in fake_db:
        if item["id"] == item_id:
            return item
    raise HTTPException(status_code=404, detail="Item not found")

# POST (Create) a new item
@app.post("/items/", response_model=Item, status_code=201) # 201 Created status
async def create_item(item: ItemCreate): # item: ItemCreate means request body must match ItemCreate model
    global next_id
    new_item = item.model_dump() # Convert Pydantic model to a dictionary
    new_item["id"] = next_id
    fake_db.append(new_item)
    next_id += 1
    return new_item

# PUT (Update) an existing item
@app.put("/items/{item_id}", response_model=Item)
async def update_item(item_id: int, updated_item: ItemCreate): # Use ItemCreate as it excludes id
    for index, item in enumerate(fake_db):
        if item["id"] == item_id:
            # Update existing item with new data, keeping its original ID
            fake_db[index].update(updated_item.model_dump())
            fake_db[index]["id"] = item_id # Ensure ID remains the same
            return fake_db[index]
    raise HTTPException(status_code=404, detail="Item not found")

# DELETE an item
@app.delete("/items/{item_id}", status_code=204) # 204 No Content for successful deletion
async def delete_item(item_id: int):
    global fake_db
    initial_len = len(fake_db)
    fake_db = [item for item in fake_db if item["id"] != item_id]
    if len(fake_db) == initial_len:
        raise HTTPException(status_code=404, detail="Item not found")
    # No content to return for 204
    return

# -------------------------------------------------------------
# 6. Run the FastAPI application
# -------------------------------------------------------------
if __name__ == "__main__":
    # Runs the app using Uvicorn.
    # host="0.0.0.0" makes it accessible from your network (if needed, typically "127.0.0.1" or "localhost" is fine)
    # port=8000 is the default port for FastAPI
    # reload=True enables hot-reloading: server restarts automatically on code changes
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)