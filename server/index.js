const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('./User');
const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret'; // Set this in Render env vars!

const app = express();
app.use(cors({
  origin: 'https://todo-frontend-zd6t.onrender.com',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  credentials: true
}));
app.use(express.json());

// Connect to MongoDB (the host will be 'mongo' when using Docker)
mongoose.connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });

// Define a simple Todo schema
const TodoSchema = new mongoose.Schema({
  text: String,
  priority: String,
  completed: Boolean,
  userId: String, // Add this field
});
const Todo = mongoose.model('Todo', TodoSchema);

// Test route
app.get('/', (req, res) => {
  res.send('Todo API is running!');
});

app.get('/api/test', (req, res) => {
  res.json({ message: 'CORS is working!' });
});

// Register
app.post('/api/register', async (req, res) => {
  const { email, password } = req.body;
  const hashed = await bcrypt.hash(password, 10);
  try {
    const user = await User.create({ email, password: hashed });
    res.json({ message: 'User created' });
  } catch (err) {
    res.status(400).json({ error: 'Email already exists' });
  }
});

// Login
app.post('/api/login', async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email });
  if (!user) return res.status(400).json({ error: 'Invalid credentials' });
  const valid = await bcrypt.compare(password, user.password);
  if (!valid) return res.status(400).json({ error: 'Invalid credentials' });
  const token = jwt.sign({ userId: user._id }, JWT_SECRET, { expiresIn: '7d' });
  res.json({ token });
});

// Auth middleware
function auth(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ error: 'No token' });
  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.userId = decoded.userId;
    next();
  } catch {
    res.status(401).json({ error: 'Invalid token' });
  }
}

// Get all todos for logged-in user
app.get('/api/todos', auth, async (req, res) => {
  const todos = await Todo.find({ userId: req.userId });
  res.json(todos);
});

// Add a new todo for logged-in user
app.post('/api/todos', auth, async (req, res) => {
  const { text, priority } = req.body;
  const todo = new Todo({ text, priority, completed: false, userId: req.userId });
  await todo.save();
  res.status(201).json(todo);
});

// Update a todo (only if it belongs to the user)
app.put('/api/todos/:id', auth, async (req, res) => {
  const { id } = req.params;
  const { text, priority, completed } = req.body;
  const todo = await Todo.findOneAndUpdate(
    { _id: id, userId: req.userId },
    { text, priority, completed },
    { new: true }
  );
  res.json(todo);
});

// Delete a todo (only if it belongs to the user)
app.delete('/api/todos/:id', auth, async (req, res) => {
  const { id } = req.params;
  await Todo.findOneAndDelete({ _id: id, userId: req.userId });
  res.json({ message: 'Todo deleted' });
});

app.listen(5000, () => console.log('Server running on port 5000'));
