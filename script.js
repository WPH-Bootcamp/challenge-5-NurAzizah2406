/* ==========================================================================
   TaskFlow - Main Application Logic
   Features: OOP Classes, Async/Await API Fetch, DOM Manipulation, LocalStorage
   Author: Nur Azizah
   ========================================================================== */

/* ==========================================
   1. DATA MODELS (CLASSES)
   ========================================== */

/**
 * Class Todo representing a single Task item.
 */
class Todo {
  /**
   * @param {string} title - The text of the task.
   * @param {boolean} completed - Task completion status.
   * @param {string|null} id - Unique identifier (generates if null).
   * @param {string|null} createdAt - Timestamp of creation.
   */
  constructor(title, completed = false, id = null, createdAt = null) {
    this.id = id || `task-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    this.title = title;
    this.completed = completed;
    this.createdAt = createdAt ? new Date(createdAt) : new Date();
  }

  /**
   * Toggles completion status.
   */
  toggleCompleted() {
    this.completed = !this.completed;
  }

  /**
   * Updates the title with validation.
   * @param {string} newTitle 
   */
  updateTitle(newTitle) {
    const trimmed = newTitle ? newTitle.trim() : "";
    if (trimmed === "") {
      throw new Error("Judul tugas tidak boleh kosong.");
    }
    if (trimmed.length < 3) {
      throw new Error("Judul tugas minimal harus 3 karakter.");
    }
    if (trimmed.length > 50) {
      throw new Error("Judul tugas maksimal 50 karakter.");
    }
    this.title = trimmed;
  }
}

/**
 * Class TodoList representing the collection of Todos and operations on them.
 */
class TodoList {
  constructor() {
    this.tasks = [];
    this.loadFromLocalStorage();
  }

  /**
   * Adds a new task to the list with strict validation.
   * @param {string} title 
   * @returns {Todo} The newly created Todo instance.
   */
  addTask(title) {
    const trimmedTitle = title ? title.trim() : "";
    
    // Validations (User feedback ready)
    if (trimmedTitle === "") {
      throw new Error("Judul tugas tidak boleh kosong!");
    }
    if (trimmedTitle.length < 3) {
      throw new Error("Judul tugas minimal harus 3 karakter.");
    }
    if (trimmedTitle.length > 50) {
      throw new Error("Judul tugas maksimal 50 karakter.");
    }
    
    // Prevent duplicate tasks (case-insensitive)
    const isDuplicate = this.tasks.some(
      task => task.title.toLowerCase() === trimmedTitle.toLowerCase()
    );
    if (isDuplicate) {
      throw new Error("Tugas dengan judul yang sama sudah ada!");
    }

    const newTodo = new Todo(trimmedTitle);
    this.tasks.unshift(newTodo); // Add to the top of list
    this.saveToLocalStorage();
    return newTodo;
  }

  /**
   * Deletes a task by ID.
   * @param {string} id 
   */
  deleteTask(id) {
    const initialCount = this.tasks.length;
    this.tasks = this.tasks.filter(task => task.id !== id);
    if (this.tasks.length === initialCount) {
      throw new Error("Tugas gagal dihapus karena tidak ditemukan.");
    }
    this.saveToLocalStorage();
  }

  /**
   * Toggles task completion state.
   * @param {string} id 
   * @returns {Todo}
   */
  toggleTask(id) {
    const task = this.tasks.find(t => t.id === id);
    if (!task) {
      throw new Error("Tugas tidak ditemukan.");
    }
    task.toggleCompleted();
    this.saveToLocalStorage();
    return task;
  }

  /**
   * Updates task title by ID.
   * @param {string} id 
   * @param {string} newTitle 
   * @returns {Todo}
   */
  updateTask(id, newTitle) {
    const task = this.tasks.find(t => t.id === id);
    if (!task) {
      throw new Error("Tugas tidak ditemukan.");
    }
    task.updateTitle(newTitle);
    this.saveToLocalStorage();
    return task;
  }

  /**
   * Clears all completed tasks from array.
   * @returns {number} The count of deleted items.
   */
  clearCompleted() {
    const completedCount = this.tasks.filter(t => t.completed).length;
    if (completedCount === 0) {
      throw new Error("Tidak ada tugas selesai yang bisa disapu bersih.");
    }
    this.tasks = this.tasks.filter(t => !t.completed);
    this.saveToLocalStorage();
    return completedCount;
  }

  /**
   * Returns statistics counts and percentage.
   * @returns {{total: number, completed: number, active: number, percent: number}}
   */
  getStats() {
    const total = this.tasks.length;
    const completed = this.tasks.filter(t => t.completed).length;
    const active = total - completed;
    const percent = total > 0 ? Math.round((completed / total) * 100) : 0;
    return { total, completed, active, percent };
  }

  /**
   * Persists the task list to localStorage.
   */
  saveToLocalStorage() {
    localStorage.setItem('taskflow_tasks', JSON.stringify(this.tasks));
  }

  /**
   * Loads tasks from localStorage and reinflates them into Todo Class instances.
   */
  loadFromLocalStorage() {
    const stored = localStorage.getItem('taskflow_tasks');
    if (stored) {
      try {
        const rawTasks = JSON.parse(stored);
        this.tasks = rawTasks.map(t => new Todo(t.title, t.completed, t.id, t.createdAt));
      } catch (e) {
        console.error("Gagal parsing local storage. Data direset.", e);
        this.tasks = [];
      }
    }
  }

  /**
   * Asynchronously fetches initial sample todos from a public API.
   * Leverages async/await and simulates connection delay.
   * @returns {Promise<number>} Count of newly added todos.
   */
  async fetchInitialTodos() {
    // Simulate server response time to showcase premium skeleton loading state
    await new Promise(resolve => setTimeout(resolve, 1500));

    try {
      const response = await fetch('https://jsonplaceholder.typicode.com/todos?_limit=5');
      if (!response.ok) {
        throw new Error(`API merespon dengan status ${response.status}`);
      }
      const rawData = await response.json();
      
      let addedCount = 0;
      rawData.forEach(item => {
        // Avoid duplicate titles
        const isDuplicate = this.tasks.some(
          t => t.title.toLowerCase() === item.title.trim().toLowerCase()
        );
        if (!isDuplicate) {
          const capitalizedTitle = item.title.charAt(0).toUpperCase() + item.title.slice(1);
          // Instantiate Todo model and push
          const newTodo = new Todo(capitalizedTitle, item.completed);
          this.tasks.push(newTodo);
          addedCount++;
        }
      });

      if (addedCount > 0) {
        this.saveToLocalStorage();
      }
      return addedCount;
    } catch (error) {
      throw new Error(`Fetch gagal: ${error.message}. Coba periksa koneksi internetmu.`);
    }
  }
}

/* ==========================================
   2. INTERACTIVE TOAST NOTIFICATIONS
   ========================================== */

/**
 * Handles spawning and animating elegant floating toast notifications.
 */
class Toast {
  /**
   * Displays a toast with preset styles
   * @param {string} message - Message body
   * @param {'success'|'error'|'warning'} type - Visual category
   * @param {number} duration - Time before dismissing in ms
   */
  static show(message, type = 'success', duration = 4000) {
    const container = document.getElementById('toast-container');
    if (!container) return;

    // Create toast card element
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;

    // Select suitable Lucide-inspired SVG icon
    let iconSvg = '';
    if (type === 'success') {
      iconSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><path d="m9 11 3 3L22 4"/></svg>`;
    } else if (type === 'error') {
      iconSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="m15 9-6 6"/><path d="m9 9 6 6"/></svg>`;
    } else {
      iconSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>`;
    }

    toast.innerHTML = `
      <div class="toast-icon">${iconSvg}</div>
      <div class="toast-message">${message}</div>
      <button class="toast-close" aria-label="Tutup Notifikasi">
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
      </button>
    `;

    container.appendChild(toast);

    // Auto dismiss
    const autoRemoveTimer = setTimeout(() => {
      this.dismiss(toast);
    }, duration);

    // Close button click listener
    toast.querySelector('.toast-close').addEventListener('click', () => {
      clearTimeout(autoRemoveTimer);
      this.dismiss(toast);
    });
  }

  /**
   * Applies fade-out transition and clears node.
   * @param {HTMLElement} toastElement 
   */
  static dismiss(toastElement) {
    toastElement.classList.add('removing');
    toastElement.addEventListener('animationend', () => {
      toastElement.remove();
    });
  }
}

/* ==========================================
   3. DOM INTERACTION & VIEW LOGIC
   ========================================== */

document.addEventListener('DOMContentLoaded', () => {
  // Instantiate the core TodoList app
  const todoApp = new TodoList();
  
  // Cache DOM element selectors
  const themeToggleBtn = document.getElementById('theme-toggle');
  const todoForm = document.getElementById('todo-form');
  const todoInput = document.getElementById('todo-input');
  const todoListContainer = document.getElementById('todo-list');
  const loadingState = document.getElementById('loading-state');
  const emptyState = document.getElementById('empty-state');
  const clearCompletedBtn = document.getElementById('clear-completed-btn');
  const fetchTriggerBtn = document.getElementById('fetch-trigger-btn');
  
  // Tabs and badge counters
  const filterTabs = document.querySelectorAll('.filter-tab');
  const countAllBadge = document.getElementById('count-all');
  const countActiveBadge = document.getElementById('count-active');
  const countCompletedBadge = document.getElementById('count-completed');
  
  // Progress bar elements
  const statsPercentage = document.getElementById('stats-percentage');
  const statsCompleted = document.getElementById('stats-completed');
  const statsTotal = document.getElementById('stats-total');
  const progressBar = document.getElementById('progress-bar');
  
  // Active Filter state
  let currentFilter = 'all';

  // Dynamic Date Rendering (Indonesian Locales)
  initHeaderDate();

  // Load user theme preference
  initTheme();

  // Application Startup Flow
  initAppFlow();

  /* ==========================================
     A. EVENT LISTENERS
     ========================================== */

  // 1. Dark/Light Theme Switching
  themeToggleBtn.addEventListener('click', () => {
    document.body.classList.toggle('light-theme');
    const isLight = document.body.classList.contains('light-theme');
    localStorage.setItem('taskflow_theme', isLight ? 'light' : 'dark');
    Toast.show(
      `Tema ${isLight ? 'Terang' : 'Gelap'} diaktifkan.`,
      'success',
      1500
    );
  });

  // 2. Add New Task Submission
  todoForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const taskTitle = todoInput.value;
    
    try {
      todoApp.addTask(taskTitle);
      
      // Clear input, styling resets
      todoInput.value = '';
      todoInput.classList.remove('input-error');
      
      Toast.show("Tugas berhasil ditambahkan!", "success");
      render();
    } catch (error) {
      todoInput.classList.add('input-error');
      Toast.show(error.message, "error");
      
      // Shake animation effect for visual feedback
      todoInput.animate([
        { transform: 'translateX(0)' },
        { transform: 'translateX(-6px)' },
        { transform: 'translateX(6px)' },
        { transform: 'translateX(-4px)' },
        { transform: 'translateX(4px)' },
        { transform: 'translateX(0)' }
      ], { duration: 400 });
    }
  });

  // Remove input error outline when typing
  todoInput.addEventListener('input', () => {
    todoInput.classList.remove('input-error');
  });

  // 3. Tab Filters Action
  filterTabs.forEach(tab => {
    tab.addEventListener('click', () => {
      filterTabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      currentFilter = tab.getAttribute('data-filter');
      render();
    });
  });

  // 4. Action: Clear All Completed
  clearCompletedBtn.addEventListener('click', () => {
    try {
      const removedCount = todoApp.clearCompleted();
      Toast.show(`Sapu bersih sukses! ${removedCount} tugas terhapus.`, 'success');
      render();
    } catch (error) {
      Toast.show(error.message, 'warning');
    }
  });

  // 5. Action: Manual Fetch from API Button (Empty state trigger)
  fetchTriggerBtn.addEventListener('click', async () => {
    await fetchApiTodos();
  });

  // 6. Interactive Event Delegation on Tasks List (Checkbox, Delete, Double Click Edit)
  todoListContainer.addEventListener('click', (e) => {
    const target = e.target;
    const todoItemElement = target.closest('.todo-item');
    if (!todoItemElement) return;
    
    const taskId = todoItemElement.getAttribute('data-id');

    // Case A: Toggle Checkbox
    if (target.closest('.todo-checkbox-wrapper')) {
      // Small delayed rendering to let CSS checkbox animation run
      setTimeout(() => {
        try {
          todoApp.toggleTask(taskId);
          render();
        } catch (error) {
          Toast.show(error.message, 'error');
        }
      }, 200);
      return;
    }

    // Case B: Delete Button
    if (target.closest('.btn-item-action.delete')) {
      // Add sliding animation before deletion
      todoItemElement.style.animation = 'toastSlideOut 0.3s ease-in forwards';
      todoItemElement.addEventListener('animationend', () => {
        try {
          todoApp.deleteTask(taskId);
          Toast.show("Tugas berhasil dihapus.", "success");
          render();
        } catch (error) {
          Toast.show(error.message, 'error');
        }
      });
      return;
    }

    // Case C: Edit Button (triggers inline editing)
    if (target.closest('.btn-item-action.edit')) {
      enableInlineEdit(todoItemElement, taskId);
      return;
    }
  });

  // Enable inline editing on double clicking a task card title
  todoListContainer.addEventListener('dblclick', (e) => {
    const titleElement = e.target.closest('.todo-item-title');
    if (!titleElement) return;

    const todoItemElement = titleElement.closest('.todo-item');
    const taskId = todoItemElement.getAttribute('data-id');
    enableInlineEdit(todoItemElement, taskId);
  });

  /* ==========================================
     B. HELPER SYSTEM FUNCTIONS
     ========================================== */

  /**
     * Toggles inline form input inside task item.
     * @param {HTMLElement} itemNode 
     * @param {string} id 
     */
  function enableInlineEdit(itemNode, id) {
    // If already editing, ignore
    if (itemNode.classList.contains('editing')) return;

    const titleSpan = itemNode.querySelector('.todo-item-title');
    const originalText = titleSpan.textContent;

    itemNode.classList.add('editing');
    
    // Replace text view with edit layout
    const contentBox = itemNode.querySelector('.todo-item-content');
    const dateText = itemNode.querySelector('.todo-item-date').outerHTML;
    
    contentBox.innerHTML = `
      <form class="todo-edit-form">
        <input type="text" class="todo-edit-input" value="${originalText}" autocomplete="off">
      </form>
      ${dateText}
    `;

    const editForm = itemNode.querySelector('.todo-edit-form');
    const editInput = itemNode.querySelector('.todo-edit-input');
    
    editInput.focus();
    // Put cursor at the end of input
    const val = editInput.value;
    editInput.value = '';
    editInput.value = val;

    // Helper closure to save changes
    const saveChanges = () => {
      const newTitle = editInput.value;
      if (newTitle.trim() === originalText.trim()) {
        // No change, just render
        itemNode.classList.remove('editing');
        render();
        return;
      }
      try {
        todoApp.updateTask(id, newTitle);
        Toast.show("Tugas berhasil diubah!", "success");
      } catch (error) {
        Toast.show(error.message, "error");
      }
      itemNode.classList.remove('editing');
      render();
    };

    // Form submission
    editForm.addEventListener('submit', (e) => {
      e.preventDefault();
      saveChanges();
    });

    // Blur focus action
    editInput.addEventListener('blur', () => {
      saveChanges();
    });

    // Escape key listener to cancel
    editInput.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        itemNode.classList.remove('editing');
        render();
      }
    });
  }

  /**
   * Initializes day and full date texts.
   */
  function initHeaderDate() {
    const currentDaySpan = document.getElementById('current-day');
    const currentDateSpan = document.getElementById('current-date');
    const now = new Date();

    const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
    const months = [
      'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 
      'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
    ];

    currentDaySpan.textContent = days[now.getDay()];
    currentDateSpan.textContent = `${now.getDate()} ${months[now.getMonth()]} ${now.getFullYear()}`;
  }

  /**
   * Restores user dark/light preference or media queries.
   */
  function initTheme() {
    const savedTheme = localStorage.getItem('taskflow_theme');
    if (savedTheme === 'light') {
      document.body.classList.add('light-theme');
    } else if (savedTheme === 'dark') {
      document.body.classList.remove('light-theme');
    } else {
      // Default matching user OS color preference
      const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
      if (!prefersDark) {
        document.body.classList.add('light-theme');
      }
    }
  }

  /**
   * Orchestrates the loading flow at startup.
   */
  async function initAppFlow() {
    // If local storage has items, skip fetching
    if (todoApp.tasks.length > 0) {
      loadingState.classList.add('hidden');
      todoListContainer.classList.remove('hidden');
      render();
    } else {
      // Automatically pull placeholder tasks on first visit
      await fetchApiTodos();
    }
  }

  /**
   * Encapsulates fetching initial placeholder tasks asynchronously.
   */
  async function fetchApiTodos() {
    loadingState.classList.remove('hidden');
    todoListContainer.classList.add('hidden');
    emptyState.classList.add('hidden');

    try {
      const added = await todoApp.fetchInitialTodos();
      if (added > 0) {
        Toast.show(`Berhasil mengimpor ${added} tugas dari API.`, 'success');
      } else {
        Toast.show("Data API berhasil dihubungi (tidak ada tugas baru yang unik).", "warning");
      }
      loadingState.classList.add('hidden');
      todoListContainer.classList.remove('hidden');
      render();
    } catch (error) {
      console.error(error);
      loadingState.classList.add('hidden');
      
      // Fallback: If empty, show empty state with instructions
      if (todoApp.tasks.length === 0) {
        emptyState.classList.remove('hidden');
      } else {
        todoListContainer.classList.remove('hidden');
        render();
      }
      
      Toast.show(error.message, 'error');
    }
  }

  /**
   * Main Render function. Synchronizes view representation with data state.
   */
  function render() {
    const stats = todoApp.getStats();

    // 1. Render Stats Progress
    statsPercentage.textContent = `${stats.percent}%`;
    statsCompleted.textContent = stats.completed;
    statsTotal.textContent = stats.total;
    progressBar.style.width = `${stats.percent}%`;

    // 2. Render Badge Counters on Tabs
    countAllBadge.textContent = stats.total;
    countActiveBadge.textContent = stats.active;
    countCompletedBadge.textContent = stats.completed;

    // 3. Filter Tasks to display
    let filteredTasks = [];
    if (currentFilter === 'all') {
      filteredTasks = todoApp.tasks;
    } else if (currentFilter === 'active') {
      filteredTasks = todoApp.tasks.filter(t => !t.completed);
    } else if (currentFilter === 'completed') {
      filteredTasks = todoApp.tasks.filter(t => t.completed);
    }

    // 4. Toggle empty visual if active items list is blank
    if (filteredTasks.length === 0) {
      todoListContainer.innerHTML = '';
      emptyState.classList.remove('hidden');
      
      // Customize empty text depending on active tab filter
      const emptyDescText = emptyState.querySelector('.empty-desc');
      if (currentFilter === 'active') {
        emptyDescText.textContent = "Hore! Tidak ada tugas aktif yang tersisa. Waktunya bersantai!";
      } else if (currentFilter === 'completed') {
        emptyDescText.textContent = "Kamu belum menyelesaikan tugas apapun. Semangat menyelesaikan rencana!";
      } else {
        emptyDescText.textContent = "Mulai harimu dengan menambahkan tugas baru di atas atau biarkan kami menarik data contoh dari API.";
      }
    } else {
      emptyState.classList.add('hidden');
      
      // Map tasks to DOM nodes
      todoListContainer.innerHTML = filteredTasks.map(task => {
        const checkedAttr = task.completed ? 'checked' : '';
        const completedClass = task.completed ? 'completed' : '';
        const localDate = new Date(task.createdAt);
        
        // Format creation time
        const pad = (n) => n < 10 ? '0' + n : n;
        const timeStr = `${pad(localDate.getHours())}:${pad(localDate.getMinutes())}`;
        
        return `
          <li class="todo-item ${completedClass}" data-id="${task.id}">
            <!-- Custom Styled Checkbox -->
            <label class="todo-checkbox-wrapper">
              <input type="checkbox" ${checkedAttr}>
              <span class="todo-checkbox-custom">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M20 6 9 17l-5-5"/></svg>
              </span>
            </label>

            <!-- Text Content -->
            <div class="todo-item-content">
              <span class="todo-item-title" title="Klik ganda untuk mengubah">${escapeHTML(task.title)}</span>
              <span class="todo-item-date">
                <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="vertical-align: middle; margin-right: 2px;"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>
                Dibuat jam ${timeStr}
              </span>
            </div>

            <!-- Actions Panel -->
            <div class="todo-actions">
              <button class="btn-item-action edit" aria-label="Ubah judul tugas" title="Ubah tugas">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg>
              </button>
              <button class="btn-item-action delete" aria-label="Hapus tugas" title="Hapus tugas">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
              </button>
            </div>
          </li>
        `;
      }).join('');
    }
  }

  /**
   * Helper utility to secure layout against XSS injections.
   * @param {string} str 
   * @returns {string} Safe string.
   */
  function escapeHTML(str) {
    return str.replace(/[&<>'"]/g, 
      tag => ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        "'": '&#39;',
        '"': '&quot;'
      }[tag] || tag)
    );
  }
});
