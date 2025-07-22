import React, { useState, useEffect } from "react";
import "./App.css";

const API_URL = process.env.REACT_APP_API_URL;

function Auth({ setToken }) {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const API_BASE = process.env.REACT_APP_API_URL.replace("/todos", "");

  const handleSubmit = async (e) => {
    e.preventDefault();
    const endpoint = isLogin ? "/login" : "/register";
    const res = await fetch(API_BASE + endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json();
    if (isLogin && data.token) {
      setToken(data.token);
      localStorage.setItem("token", data.token);
    } else if (!isLogin && data.message) {
      alert("Registration successful! Please log in.");
      setIsLogin(true);
    } else if (data.error) {
      alert(data.error);
    }
  };

  return (
    <form onSubmit={handleSubmit} style={{ margin: 32 }}>
      <h2>{isLogin ? "Login" : "Register"}</h2>
      <input
        type="email"
        placeholder="Email"
        value={email}
        required
        onChange={e => setEmail(e.target.value)}
      /><br/>
      <input
        type="password"
        placeholder="Password"
        value={password}
        required
        onChange={e => setPassword(e.target.value)}
      /><br/>
      <button type="submit">{isLogin ? "Login" : "Register"}</button>
      <br/>
      <span style={{ cursor: "pointer", color: "#7f7fff" }} onClick={() => setIsLogin(!isLogin)}>
        {isLogin ? "No account? Register" : "Have an account? Login"}
      </span>
    </form>
  );
}

function App() {
  const [todos, setTodos] = useState([]);
  const [text, setText] = useState("");
  const [priority, setPriority] = useState("Medium");
  const [filter, setFilter] = useState("All");
  const [token, setToken] = useState(localStorage.getItem("token") || "");

  // Always call hooks before any return!
  useEffect(() => {
    if (token) {
      fetchTodos();
    }
    // eslint-disable-next-line
  }, [token]);

  async function fetchTodos() {
    const res = await fetch(API_URL, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Bearer " + token
      }
    });
    if (res.status === 401) {
      setToken("");
      localStorage.removeItem("token");
      return;
    }
    const data = await res.json();
    setTodos(data);
  }

  if (!token) {
    return <Auth setToken={setToken} />;
  }

  const addTodo = async () => {
    if (!text) return;
    const res = await fetch(API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Bearer " + token
      },
      body: JSON.stringify({ text, priority }),
    });
    const newTodo = await res.json();
    setTodos([...todos, newTodo]);
    setText("");
    setPriority("Medium");
  };

  const toggleComplete = async (id, completed) => {
    const todo = todos.find((t) => t._id === id);
    const res = await fetch(`${API_URL}/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Bearer " + token
      },
      body: JSON.stringify({ ...todo, completed: !completed }),
    });
    const updated = await res.json();
    setTodos(todos.map((t) => (t._id === id ? updated : t)));
  };

  const deleteTodo = async (id) => {
    await fetch(`${API_URL}/${id}`, { method: "DELETE", headers: { "Authorization": "Bearer " + token } });
    setTodos(todos.filter((t) => t._id !== id));
  };

  // Filtering
  const filteredTodos =
    filter === "All"
      ? todos
      : todos.filter((t) => t.priority === filter);

  const completedCount = todos.filter((t) => t.completed).length;
  const remainingCount = todos.length - completedCount;
  const progress = todos.length ? (completedCount / todos.length) * 100 : 0;

  return (
    <div className="app-bg">
      <div className="header-gradient">
        <span className="sparkle">✨</span>
        <span className="header-title">Transform your productivity with style</span>
        <span className="sparkle">✨</span>
      </div>

      <div className="counters">
        <div className="counter completed">
          <span>✔️ {completedCount} completed</span>
        </div>
        <div className="counter remaining">
          <span>🕒 {remainingCount} remaining</span>
        </div>
      </div>

      <div className="todo-box">
        <input
          className="todo-input"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="What needs to be done? ✏️"
        />
        <div className="priority-row">
          <span>Priority:</span>
          {["Low", "Medium", "High"].map((p) => (
            <button
              key={p}
              className={`priority-btn ${priority === p ? p.toLowerCase() + "-active" : ""}`}
              onClick={() => setPriority(p)}
            >
              {p}
            </button>
          ))}
          <button className="add-btn" onClick={addTodo}>
            + Add Task
          </button>
        </div>
        <div className="filter-row">
          <span>Filter:</span>
          {["All", "Low", "Medium", "High"].map((f) => (
            <button
              key={f}
              className={`filter-btn ${filter === f ? "filter-active" : ""}`}
              onClick={() => setFilter(f)}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      <ul className="todo-list">
        {filteredTodos.map((todo) => (
          <li key={todo._id} className={`todo-item ${todo.completed ? "completed" : ""}`}>
            <span
              className="todo-text"
              onClick={() => toggleComplete(todo._id, todo.completed)}
            >
              {todo.text}
            </span>
            <span className={`priority-label ${todo.priority.toLowerCase()}`}>
              {todo.priority}
            </span>
            <button className="delete-btn" onClick={() => deleteTodo(todo._id)}>
              🗑️
            </button>
          </li>
        ))}
      </ul>

      <div className="progress-section">
        <span className="sparkle">✨</span>
        <span className="progress-text">
          {remainingCount === 0
            ? "All tasks completed! 🎉"
            : `Keep going! ${remainingCount} tasks remaining`}
        </span>
        <span className="sparkle">✨</span>
        <div className="progress-bar-bg">
          <div className="progress-bar" style={{ width: `${progress}%` }} />
        </div>
      </div>
      <button
        style={{ margin: "16px", background: "#e040fb", color: "#fff", border: "none", borderRadius: "8px", padding: "8px 16px", cursor: "pointer" }}
        onClick={() => {
          setToken("");
          localStorage.removeItem("token");
        }}
      >
        Logout
      </button>
    </div>
  );
}

export default App;