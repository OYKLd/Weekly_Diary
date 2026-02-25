// Configuration globale
const CONFIG = {
  STORAGE_KEY: 'weekly_diary_events',
  DAYS: ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'],
  HOURS: Array.from({length: 24}, (_, i) => i),
  EVENT_COLORS: {
    work: '#3B82F6',
    personal: '#10B981',
    meeting: '#F59E0B',
    other: '#8B5CF6'
  }
};

// État de l'application
let state = {
  currentWeek: getStartOfWeek(new Date()),
  events: [],
  editingEvent: null
};

// Éléments DOM
const elements = {
  weekTitle: document.getElementById('weekTitle'),
  prevWeek: document.getElementById('prevWeek'),
  nextWeek: document.getElementById('nextWeek'),
  todayBtn: document.getElementById('todayBtn'),
  timeSlots: document.getElementById('timeSlots'),
  daysGrid: document.getElementById('daysGrid'),
  eventModal: document.getElementById('eventModal'),
  modalTitle: document.getElementById('modalTitle'),
  eventForm: document.getElementById('eventForm'),
  closeModal: document.getElementById('closeModal'),
  cancelBtn: document.getElementById('cancelBtn'),
  addEventBtn: document.getElementById('addEventBtn'),
  eventTitle: document.getElementById('eventTitle'),
  eventDay: document.getElementById('eventDay'),
  eventHour: document.getElementById('eventHour'),
  eventDuration: document.getElementById('eventDuration'),
  eventType: document.getElementById('eventType')
};

// Utilitaires
function getStartOfWeek(date) {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  return new Date(d.setDate(diff));
}

function formatDate(date) {
  return date.toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });
}

function formatTime(hour) {
  return `${hour.toString().padStart(2, '0')}:00`;
}

function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

function getEventPosition(hour, duration) {
  const hourHeight = 60; // Correspond à --hour-height en CSS
  return {
    top: hour * hourHeight,
    height: duration * hourHeight - 4 // -4 pour les marges
  };
}

// Gestion LocalStorage
function saveEvents() {
  localStorage.setItem(CONFIG.STORAGE_KEY, JSON.stringify(state.events));
}

function loadEvents() {
  const stored = localStorage.getItem(CONFIG.STORAGE_KEY);
  if (stored) {
    state.events = JSON.parse(stored);
  }
}

// Génération de la grille
function generateTimeSlots() {
  elements.timeSlots.innerHTML = '';
  CONFIG.HOURS.forEach(hour => {
    const slot = document.createElement('div');
    slot.className = 'time-slot';
    slot.textContent = formatTime(hour);
    elements.timeSlots.appendChild(slot);
  });
}

function generateDaysGrid() {
  elements.daysGrid.innerHTML = '';
  
  // En-têtes des jours
  CONFIG.DAYS.forEach((day, index) => {
    const date = new Date(state.currentWeek);
    date.setDate(date.getDate() + index);
    
    const header = document.createElement('div');
    header.className = 'day-header';
    
    // Vérifier si c'est aujourd'hui
    const today = new Date();
    if (date.toDateString() === today.toDateString()) {
      header.classList.add('today');
    }
    
    header.innerHTML = `
      <div class="day-name">${day}</div>
      <div class="day-date">${date.getDate()}</div>
    `;
    
    elements.daysGrid.appendChild(header);
  });
  
  // Colonnes des jours avec créneaux horaires
  CONFIG.DAYS.forEach((day, dayIndex) => {
    const column = document.createElement('div');
    column.className = 'day-column';
    column.dataset.day = dayIndex;
    
    CONFIG.HOURS.forEach(hour => {
      const slot = document.createElement('div');
      slot.className = 'hour-slot';
      slot.dataset.day = dayIndex;
      slot.dataset.hour = hour;
      
      slot.addEventListener('click', () => openEventModal(dayIndex, hour));
      
      column.appendChild(slot);
    });
    
    elements.daysGrid.appendChild(column);
  });
}

// Gestion des événements
function renderEvents() {
  // Supprimer les événements existants
  document.querySelectorAll('.event').forEach(event => event.remove());
  
  // Filtrer les événements de la semaine courante
  const weekStart = state.currentWeek.getTime();
  const weekEnd = weekStart + (7 * 24 * 60 * 60 * 1000);
  
  state.events.forEach(event => {
    const eventDate = new Date(event.timestamp);
    if (eventDate.getTime() >= weekStart && eventDate.getTime() < weekEnd) {
      renderEvent(event);
    }
  });
}

function renderEvent(event) {
  const dayColumn = document.querySelector(`.day-column[data-day="${event.day}"]`);
  if (!dayColumn) return;
  
  const position = getEventPosition(event.hour, event.duration);
  
  const eventEl = document.createElement('div');
  eventEl.className = `event ${event.type}`;
  eventEl.dataset.id = event.id;
  eventEl.style.top = `${position.top}px`;
  eventEl.style.height = `${position.height}px`;
  eventEl.textContent = event.title;
  
  eventEl.addEventListener('click', (e) => {
    e.stopPropagation();
    deleteEvent(event.id);
  });
  
  dayColumn.appendChild(eventEl);
}

function createEvent(eventData) {
  const event = {
    id: generateId(),
    ...eventData,
    timestamp: new Date().getTime(),
    createdAt: new Date().toISOString()
  };
  
  state.events.push(event);
  saveEvents();
  renderEvents();
  
  return event;
}

function deleteEvent(eventId) {
  if (confirm('Supprimer cet événement ?')) {
    state.events = state.events.filter(e => e.id !== eventId);
    saveEvents();
    renderEvents();
  }
}

// Modal
function openEventModal(day = null, hour = null) {
  state.editingEvent = null;
  elements.modalTitle.textContent = 'Nouvel événement';
  elements.eventForm.reset();
  
  if (day !== null) elements.eventDay.value = day;
  if (hour !== null) elements.eventHour.value = hour;
  
  elements.eventModal.classList.add('active');
}

function closeEventModal() {
  elements.eventModal.classList.remove('active');
  elements.eventForm.reset();
  state.editingEvent = null;
}

function generateHourOptions() {
  elements.eventHour.innerHTML = '';
  CONFIG.HOURS.forEach(hour => {
    const option = document.createElement('option');
    option.value = hour;
    option.textContent = formatTime(hour);
    elements.eventHour.appendChild(option);
  });
}

// Navigation
function updateWeekTitle() {
  const weekEnd = new Date(state.currentWeek);
  weekEnd.setDate(weekEnd.getDate() + 6);
  
  elements.weekTitle.textContent = `Semaine du ${formatDate(state.currentWeek)}`;
}

function previousWeek() {
  state.currentWeek.setDate(state.currentWeek.getDate() - 7);
  state.currentWeek = new Date(state.currentWeek);
  updateWeekTitle();
  generateDaysGrid();
  renderEvents();
}

function nextWeek() {
  state.currentWeek.setDate(state.currentWeek.getDate() + 7);
  state.currentWeek = new Date(state.currentWeek);
  updateWeekTitle();
  generateDaysGrid();
  renderEvents();
}

function goToToday() {
  state.currentWeek = getStartOfWeek(new Date());
  updateWeekTitle();
  generateDaysGrid();
  renderEvents();
}

// Initialisation
function init() {
  loadEvents();
  generateHourOptions();
  generateTimeSlots();
  generateDaysGrid();
  updateWeekTitle();
  renderEvents();
  
  // Écouteurs d'événements
  elements.prevWeek.addEventListener('click', previousWeek);
  elements.nextWeek.addEventListener('click', nextWeek);
  elements.todayBtn.addEventListener('click', goToToday);
  elements.addEventBtn.addEventListener('click', () => openEventModal());
  elements.closeModal.addEventListener('click', closeEventModal);
  elements.cancelBtn.addEventListener('click', closeEventModal);
  
  // Formulaire
  elements.eventForm.addEventListener('submit', (e) => {
    e.preventDefault();
    
    const eventData = {
      title: elements.eventTitle.value.trim(),
      day: parseInt(elements.eventDay.value),
      hour: parseInt(elements.eventHour.value),
      duration: parseInt(elements.eventDuration.value),
      type: elements.eventType.value
    };
    
    if (!eventData.title) {
      alert('Veuillez entrer un titre pour l\'événement');
      return;
    }
    
    createEvent(eventData);
    closeEventModal();
  });
  
  // Fermer la modal en cliquant à l'extérieur
  elements.eventModal.addEventListener('click', (e) => {
    if (e.target === elements.eventModal) {
      closeEventModal();
    }
  });
  
  // Navigation au clavier
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && elements.eventModal.classList.contains('active')) {
      closeEventModal();
    }
  });
}

// Démarrer l'application
document.addEventListener('DOMContentLoaded', init);