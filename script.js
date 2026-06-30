document.addEventListener('DOMContentLoaded', () => {

    const taskInput = document.getElementById('taskInput');
    const dueDate = document.getElementById('dueDate');
    const dueTime = document.getElementById('dueTime');
    const priority = document.getElementById('priority');
    const category = document.getElementById('category');
    const addTaskBtn = document.getElementById('addTaskBtn');
    const taskList = document.getElementById('taskList');
    const searchTask = document.getElementById('searchTask');
    const filterTasks = document.getElementById('filterTasks');
    const clearAllBtn = document.getElementById('clearAll');
    const taskCount = document.getElementById('taskCount');
    const progressBar = document.getElementById('progressBar');
    const darkModeToggle = document.getElementById('darkModeToggle');
    const reminderSound = document.getElementById('reminderSound');

    const totalTasksEl = document.getElementById('totalTasks');
    const completedTasksEl = document.getElementById('completedTasks');
    const pendingTasksEl = document.getElementById('pendingTasks');

    let tasks = JSON.parse(localStorage.getItem('tasks')) || [];

    const categoryColors = {
        Personal:'#4facfe',
        Work:'#ff5e62',
        Study:'#7b2ff7',
        Other:'#888'
    };

    // ===== Dark Mode =====
    if(localStorage.getItem('darkMode') === 'on'){
        document.body.classList.add('dark');
        darkModeToggle.innerHTML = '<i class="fa-solid fa-sun"></i>';
    }

    darkModeToggle.addEventListener('click', () => {
        document.body.classList.toggle('dark');
        const isDark = document.body.classList.contains('dark');
        localStorage.setItem('darkMode', isDark ? 'on' : 'off');
        darkModeToggle.innerHTML = isDark
            ? '<i class="fa-solid fa-sun"></i>'
            : '<i class="fa-solid fa-moon"></i>';
    });

    function saveTasks() {
        localStorage.setItem('tasks', JSON.stringify(tasks));
    }

    function renderTasks(filter = 'all', search = '') {
        taskList.innerHTML = '';

        let filteredTasks = tasks.filter(task => {
            const matchesSearch = task.text.toLowerCase().includes(search.toLowerCase());
            const matchesFilter =
                filter === 'all' ? true :
                filter === 'completed' ? task.completed :
                !task.completed;
            return matchesSearch && matchesFilter;
        });

        filteredTasks.forEach(task => {
            const li = document.createElement('li');
            li.dataset.id = task.id;
            li.classList.add(`priority-${task.priority}`);

            const catColor = categoryColors[task.category] || '#888';

            li.innerHTML = `
                <span class="task-text ${task.completed ? 'completed' : ''}">
                    <span class="tag" style="background:${catColor}">${task.category}</span>
                    ${task.text}
                    <span class="task-meta">
                        ${task.dueDate ? `📅 ${task.dueDate}` : ''}
                        ${task.dueTime ? `⏰ ${task.dueTime}` : ''}
                        ⚡ ${task.priority}
                    </span>
                </span>
                <div class="actions">
                    <button class="edit-btn">Edit</button>
                    <button class="done-btn">${task.completed ? 'Undo' : 'Done'}</button>
                    <button class="delete-btn">Delete</button>
                </div>
            `;

            taskList.appendChild(li);
        });

        updateDashboard();
    }

    function addTask() {
        const text = taskInput.value.trim();

        if (text === '') {
            alert('Please enter a task!');
            return;
        }

        const newTask = {
            id: Date.now(),
            text: text,
            dueDate: dueDate.value,
            dueTime: dueTime.value,
            priority: priority.value,
            category: category.value,
            completed: false,
            notified: false
        };

        tasks.push(newTask);
        saveTasks();
        renderTasks(filterTasks.value, searchTask.value);

        taskInput.value = '';
        dueDate.value = '';
        dueTime.value = '';
        priority.value = 'Medium';
        category.value = 'Personal';
    }

    function updateDashboard() {
        const total = tasks.length;
        const completed = tasks.filter(t => t.completed).length;
        const pending = total - completed;

        totalTasksEl.textContent = total;
        completedTasksEl.textContent = completed;
        pendingTasksEl.textContent = pending;
        taskCount.textContent = total;

        const percent = total === 0 ? 0 : (completed / total) * 100;
        progressBar.style.width = percent + '%';
    }

    addTaskBtn.addEventListener('click', addTask);

    taskInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') addTask();
    });

    taskList.addEventListener('click', (e) => {
        const li = e.target.closest('li');
        if (!li) return;

        const id = Number(li.dataset.id);
        const task = tasks.find(t => t.id === id);

        if (e.target.classList.contains('done-btn')) {
            task.completed = !task.completed;
            saveTasks();
            renderTasks(filterTasks.value, searchTask.value);
        }

        if (e.target.classList.contains('delete-btn')) {
            li.classList.add('task-fade-out');
            setTimeout(() => {
                tasks = tasks.filter(t => t.id !== id);
                saveTasks();
                renderTasks(filterTasks.value, searchTask.value);
            }, 280);
        }

        if (e.target.classList.contains('edit-btn')) {
            const newText = prompt('Edit your task:', task.text);
            if (newText !== null && newText.trim() !== '') {
                task.text = newText.trim();
                saveTasks();
                renderTasks(filterTasks.value, searchTask.value);
            }
        }
    });

    searchTask.addEventListener('input', () => {
        renderTasks(filterTasks.value, searchTask.value);
    });

    filterTasks.addEventListener('change', () => {
        renderTasks(filterTasks.value, searchTask.value);
    });

    clearAllBtn.addEventListener('click', () => {
        if (confirm('Are you sure you want to delete all tasks?')) {
            tasks = [];
            saveTasks();
            renderTasks();
        }
    });

    // ===== Reminder: sound + notification =====
    if ('Notification' in window && Notification.permission === 'default') {
        Notification.requestPermission();
    }

    setInterval(() => {
        const now = new Date();
        tasks.forEach(task => {
            if (task.dueDate && task.dueTime && !task.completed && !task.notified) {
                const due = new Date(`${task.dueDate}T${task.dueTime}`);
                if (now >= due && now - due < 60000) {
                    task.notified = true;
                    saveTasks();

                    reminderSound.play().catch(() => {});

                    if ('Notification' in window && Notification.permission === 'granted') {
                        new Notification('Task Reminder ⏰', {
                            body: task.text
                        });
                    } else {
                        alert(`⏰ Reminder: ${task.text}`);
                    }
                }
            }
        });
    }, 30000);

    renderTasks();

});
