const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

// Connect to MongoDB (the host will be 'mongo' when using Docker)
mongoose.connect('mongodb://mongo:27017/todos', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

// Define a simple Todo schema
const TodoSchema = new mongoose.Schema({
  text: String,
  priority: String,
  completed: Boolean,
});
const Todo = mongoose.model('Todo', TodoSchema);

// Test route
app.get('/', (req, res) => {
  res.send('Todo API is running!');
});
// ... existing code ...

// Get all todos
app.get('/api/todos', async (req, res) => {
    const todos = await Todo.find();
    res.json(todos);
  });
  
  // Add a new todo
  app.post('/api/todos', async (req, res) => {
    const { text, priority } = req.body;
    const todo = new Todo({ text, priority, completed: false });
    await todo.save();
    res.status(201).json(todo);
  });
  
  // Update a todo (mark as completed or edit)
  app.put('/api/todos/:id', async (req, res) => {
    const { id } = req.params;
    const { text, priority, completed } = req.body;
    const todo = await Todo.findByIdAndUpdate(
      id,
      { text, priority, completed },
      { new: true }
    );
    res.json(todo);
  });
  
  // Delete a todo
  app.delete('/api/todos/:id', async (req, res) => {
    const { id } = req.params;
    await Todo.findByIdAndDelete(id);
    res.json({ message: 'Todo deleted' });
  });

app.listen(5000, () => console.log('Server running on port 5000'));
