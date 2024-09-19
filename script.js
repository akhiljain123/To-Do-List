let db;
const DB_NAME = 'TodoListDB';
const DB_VERSION = 1;
const STORE_NAME = 'tasks';

const taskInput = document.getElementById('taskInput');
const assigneeInput = document.getElementById('assigneeInput');
const addTaskButton = document.getElementById('addTask');
const taskList = document.getElementById('taskList');
const membersList = document.getElementById('membersList');

function openDB() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);

        request.onerror = () => reject('Error opening database');
        request.onsuccess = () => {
            db = request.result;
            resolve(db);
        };
        request.onupgradeneeded = (event) => {
            db = event.target.result;
            db.createObjectStore(STORE_NAME, { keyPath: 'id', autoIncrement: true });
        };
    });
}

function addTask(task) {
    return new Promise((resolve, reject) => {
        const transaction = db.transaction([STORE_NAME], 'readwrite');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.add(task);

        request.onerror = () => reject('Error adding task');
        request.onsuccess = () => resolve(request.result);
    });
}

function getAllTasks() {
    return new Promise((resolve, reject) => {
        const transaction = db.transaction([STORE_NAME], 'readonly');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.getAll();

        request.onerror = () => reject('Error getting tasks');
        request.onsuccess = () => resolve(request.result);
    });
}

function updateTask(task) {
    return new Promise((resolve, reject) => {
        const transaction = db.transaction([STORE_NAME], 'readwrite');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.put(task);

        request.onerror = () => reject('Error updating task');
        request.onsuccess = () => resolve(request.result);
    });
}

function deleteTask(id) {
    return new Promise((resolve, reject) => {
        const transaction = db.transaction([STORE_NAME], 'readwrite');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.delete(id);

        request.onerror = () => reject('Error deleting task');
        request.onsuccess = () => resolve(request.result);
    });
}

function renderTasks(tasks) {
    taskList.innerHTML = '';
    tasks.forEach((task) => {
        const li = document.createElement('li');
        li.innerHTML = `
            <input type="checkbox" ${task.completed ? 'checked' : ''}>
            <span class="${task.completed ? 'completed' : ''}">${task.text} (Assigned to: ${task.assignee})</span>
            <button class="delete-btn">Delete</button>
        `;

        const checkbox = li.querySelector('input[type="checkbox"]');
        checkbox.addEventListener('change', () => {
            task.completed = checkbox.checked;
            updateTask(task).then(renderAllTasks);
        });

        const deleteBtn = li.querySelector('.delete-btn');
        deleteBtn.addEventListener('click', () => {
            deleteTask(task.id).then(renderAllTasks);
        });

        taskList.appendChild(li);
    });
}

function renderMembers(tasks) {
    const members = {};
    tasks.forEach((task) => {
        if (members[task.assignee]) {
            members[task.assignee]++;
        } else {
            members[task.assignee] = 1;
        }
    });

    membersList.innerHTML = '';
    Object.entries(members).forEach(([member, count]) => {
        const li = document.createElement('li');
        li.className = 'member-item';
        li.innerHTML = `
            <span>${member}</span>
            <span class="task-count">${count} task${count !== 1 ? 's' : ''}</span>
        `;
        membersList.appendChild(li);
    });
}

function renderAllTasks() {
    getAllTasks().then((tasks) => {
        renderTasks(tasks);
        renderMembers(tasks);
    });
}

addTaskButton.addEventListener('click', () => {
    const text = taskInput.value.trim();
    const assignee = assigneeInput.value.trim();
    if (text !== '' && assignee !== '') {
        addTask({ text, assignee, completed: false }).then(() => {
            renderAllTasks();
            taskInput.value = '';
            assigneeInput.value = '';
        });
    }
});

openDB().then(renderAllTasks);