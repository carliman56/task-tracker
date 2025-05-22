import React, { useState, useEffect } from 'react';
import './App.css';

const defaultTasks = [];

function App() {
  const [tasks, setTasks] = useState(() => {
    const saved = localStorage.getItem('tasks');
    return saved ? JSON.parse(saved) : defaultTasks;
  });
  const [newTask, setNewTask] = useState({ title: '', dueDate: '', priority: 'Medium', category: '', timeSpent: 0 });
  const [view, setView] = useState('daily');
  const [gradientStart, setGradientStart] = useState('#e0f7fa');
  const [gradientEnd, setGradientEnd] = useState('#fff3e0');

  const today = new Date().toISOString().split('T')[0];
  const startOfWeek = new Date();
  startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
  const weekDates = Array.from({ length: 7 }, (_, i) => {
    const date = new Date(startOfWeek);
    date.setDate(date.getDate() + i);
    return date.toISOString().split('T')[0];
  });
  const currentMonth = new Date().toISOString().split('T')[0].slice(0, 7);

  useEffect(() => {
    localStorage.setItem('tasks', JSON.stringify(tasks));
  }, [tasks]);

  useEffect(() => {
    document.body.setAttribute('data-theme', 'light');
  }, []);

  useEffect(() => {
    const bg = `linear-gradient(135deg, ${gradientStart}, ${gradientEnd})`;
    document.body.style.background = bg;
  }, [gradientStart, gradientEnd]);

  const addTask = () => {
    if (newTask.title.trim()) {
      setTasks([...tasks, { ...newTask, id: Date.now(), status: 'Not Started', startTime: null }]);
      setNewTask({ title: '', dueDate: '', priority: 'Medium', category: '', timeSpent: 0 });
    }
  };

  const updateTask = (id, updates) => {
    setTasks(tasks.map(task => (task.id === id ? { ...task, ...updates } : task)));
  };

  const toggleTimer = (id) => {
    setTasks(tasks.map(task => {
      if (task.id !== id) return task;
      if (task.startTime) {
        const now = Date.now();
        const elapsed = Math.floor((now - task.startTime) / 1000);
        return { ...task, timeSpent: task.timeSpent + elapsed, startTime: null };
      } else {
        return { ...task, startTime: Date.now() };
      }
    }));
  };

  const formatTime = (seconds) => `${Math.floor(seconds / 60)}m ${seconds % 60}s`;

  const filteredTasks = tasks.filter(task => {
    if (view === 'daily') return task.dueDate === today;
    if (view === 'weekly') return weekDates.includes(task.dueDate);
    if (view === 'monthly') return task.dueDate && task.dueDate.startsWith(currentMonth);
    return true;
  });

  const exportCSV = () => {
    const csvRows = [
      ['Title', 'Due Date', 'Priority', 'Category', 'Status', 'Time Spent'],
      ...tasks.map(task => [task.title, task.dueDate, task.priority, task.category, task.status, formatTime(task.timeSpent)])
    ];
    const blob = new Blob([csvRows.map(row => row.join(',')).join('\n')], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'tasks.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="App">
      <div className="theme-toggle">
        <button onClick={() => {
          const current = document.body.getAttribute('data-theme') || 'light';
          document.body.setAttribute('data-theme', current === 'light' ? 'dark' : 'light');
        }}>
          Toggle Theme
        </button>
      </div>

      <div className="gradient-picker">
        <label>
          Start Color:
          <input type="color" value={gradientStart} onChange={(e) => setGradientStart(e.target.value)} />
        </label>
        <label>
          End Color:
          <input type="color" value={gradientEnd} onChange={(e) => setGradientEnd(e.target.value)} />
        </label>
      </div>

      <h1>Task Tracker</h1>

      <div className="view-toggle">
        <button onClick={() => setView('daily')}>Daily</button>
        <button onClick={() => setView('weekly')}>Weekly</button>
        <button onClick={() => setView('monthly')}>Monthly</button>
        <button onClick={exportCSV}>Export CSV</button>
      </div>

      <div className="new-task">
        <input type="text" placeholder="Task Title" value={newTask.title} onChange={e => setNewTask({ ...newTask, title: e.target.value })} />
        <input type="date" value={newTask.dueDate} onChange={e => setNewTask({ ...newTask, dueDate: e.target.value })} />
        <select value={newTask.priority} onChange={e => setNewTask({ ...newTask, priority: e.target.value })}>
          <option>Low</option>
          <option>Medium</option>
          <option>High</option>
        </select>
        <input type="text" placeholder="Category" value={newTask.category} onChange={e => setNewTask({ ...newTask, category: e.target.value })} />
        <button onClick={addTask}>Add Task</button>
      </div>

      <h2>{view.charAt(0).toUpperCase() + view.slice(1)} View</h2>
      <div className="task-list">
        {filteredTasks.map(task => (
          <div key={task.id} className="task-card" data-priority={task.priority}>
            <h3>{task.title}</h3>
            <p>Due: {task.dueDate}</p>
            <p>Priority: {task.priority}</p>
            <p>Category: {task.category}</p>
            <p>Status: {task.status}</p>
            <p>Time Spent: {formatTime(task.timeSpent)}</p>
            <button onClick={() => toggleTimer(task.id)}>{task.startTime ? 'Stop Timer' : 'Start Timer'}</button>
            <select value={task.status} onChange={e => updateTask(task.id, { status: e.target.value })}>
              <option>Not Started</option>
              <option>In Progress</option>
              <option>Completed</option>
            </select>
          </div>
        ))}
      </div>

      <div className="dashboard">
        {weekDates.map(date => {
          const dayTasks = tasks.filter(task => task.dueDate === date);
          const dayName = new Date(date).toLocaleDateString(undefined, { weekday: 'short' });
          const total = dayTasks.reduce((sum, task) => sum + task.timeSpent, 0);

          return (
            <div className={`day-column ${date === today ? 'today' : ''}`} key={date}>
              <h4>{dayName}</h4>
              {dayTasks.map(task => (
                <div key={task.id} className="task-summary">
                  <strong>{task.title}</strong><br />
                  {Math.floor(task.timeSpent / 60)}m {task.timeSpent % 60}s
                </div>
              ))}
              <div style={{ marginTop: 'auto', fontWeight: 'bold', marginTop: '10px' }}>
                Total: {Math.floor(total / 60)}m {total % 60}s
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default App;
