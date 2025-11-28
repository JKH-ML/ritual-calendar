const weekdayRow = document.getElementById("weekdayRow");
const dayGrid = document.getElementById("dayGrid");
const monthLabel = document.getElementById("monthLabel");
const eventList = document.getElementById("eventList");
const sidebarTitle = document.getElementById("sidebarTitle");
const modalBackdrop = document.getElementById("modalBackdrop");
const modalEvent = document.getElementById("modalEvent");
const modalDelete = document.getElementById("modalDelete");
const modalTitleEl = document.getElementById("modalTitle");
const modalForm = document.getElementById("modalForm");
const lblTitle = document.getElementById("lblTitle");
const lblStart = document.getElementById("lblStart");
const lblEnd = document.getElementById("lblEnd");
const lblAllDay = document.getElementById("lblAllDay");
const lblLocation = document.getElementById("lblLocation");
const lblReminder = document.getElementById("lblReminder");
const inputEventId = document.getElementById("inputEventId");
const inputStartDate = document.getElementById("inputStartDate");
const inputEndDate = document.getElementById("inputEndDate");
const inputTitle = document.getElementById("inputTitle");
const inputTime = document.getElementById("inputTime");
const inputEndTime = document.getElementById("inputEndTime");
const inputAllDay = document.getElementById("inputAllDay");
const modalCancel = document.getElementById("modalCancel");
const modalClose = document.getElementById("modalClose");
const deleteClose = document.getElementById("deleteClose");
const deleteCancel = document.getElementById("deleteCancel");
const deleteConfirm = document.getElementById("deleteConfirm");
const deleteText = document.getElementById("deleteText");
const inputLocation = document.getElementById("inputLocation");
const inputReminder = document.getElementById("inputReminder");
const deleteTitleEl = document.getElementById("deleteTitle");
const syncBtn = document.getElementById("syncBtn");
const ritualBackdrop = document.getElementById("ritualBackdrop");
const ritualTitle = document.getElementById("ritualTitle");
const ritualClose = document.getElementById("ritualClose");
const ritualButtons = () => Array.from(document.querySelectorAll(".pick-btn"));
const ritualDateText = document.getElementById("ritualDateText");
const dayContextMenu = document.getElementById("dayContextMenu");
const contextItems = () => Array.from(document.querySelectorAll(".context-item"));
const contextDateLabel = document.getElementById("contextDateLabel");
const contextClose = document.getElementById("contextClose");
const ctxClearGeneral = document.getElementById("ctxClearGeneral");
const ctxClearRitual = document.getElementById("ctxClearRitual");
const ctxClearAll = document.getElementById("ctxClearAll");
const menuBtn = document.getElementById("menuBtn");
const settingsBackdrop = document.getElementById("settingsBackdrop");
const settingsClose = document.getElementById("settingsClose");
const toggleHoliday = document.getElementById("toggleHoliday");
const toggleHolidayPriority = document.getElementById("toggleHolidayPriority");
const languageSelect = document.getElementById("languageSelect");
const settingsHolidayLabel = document.getElementById("settingsHolidayLabel");
const settingsHolidayHelp = document.getElementById("settingsHolidayHelp");
const settingsPriorityLabel = document.getElementById("settingsPriorityLabel");
const settingsPriorityHelp = document.getElementById("settingsPriorityHelp");
const settingsLanguageLabel = document.getElementById("settingsLanguageLabel");
const settingsLanguageHelp = document.getElementById("settingsLanguageHelp");
const settingsTitle = document.getElementById("settingsTitle");
const ritualGeneralLabel = document.getElementById("ritualGeneralLabel");
const ritualRecordLabel = document.getElementById("ritualRecordLabel");
const ritualWorkoutLabel = document.getElementById("ritualWorkoutLabel");
const ritualProjectLabel = document.getElementById("ritualProjectLabel");

// Ritual emoji snippets (from assets/animated-emojis.txt)
const ritualEmojis = {
  "✏️": `<picture>
  <source srcset="https://fonts.gstatic.com/s/e/notoemoji/latest/270f_fe0f/512.webp" type="image/webp">
  <img src="https://fonts.gstatic.com/s/e/notoemoji/latest/270f_fe0f/512.gif" alt="✏️" width="16" height="16">
</picture>`,
  "🔥": `<picture>
  <source srcset="https://fonts.gstatic.com/s/e/notoemoji/latest/1f525/512.webp" type="image/webp">
  <img src="https://fonts.gstatic.com/s/e/notoemoji/latest/1f525/512.gif" alt="🔥" width="16" height="16">
</picture>`,
  "🚀": `<picture>
  <source srcset="https://fonts.gstatic.com/s/e/notoemoji/latest/1f680/512.webp" type="image/webp">
  <img src="https://fonts.gstatic.com/s/e/notoemoji/latest/1f680/512.gif" alt="🚀" width="16" height="16">
</picture>`
};

let events = {};
let settings = {
  showHolidays: true,
  holidayPriority: true,
  language: "en"
};
let modalState = { mode: "create", id: null, dateKey: null, endDateKey: null, allDay: false, deleteTitle: null };
let ritualState = { dateKey: null };
let contextMenuState = { dateKey: null };

const state = {
  current: new Date(),
  selected: null,
  selectedKey: null
};

const i18n = {
  en: {
    weekdayNames: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"],
    weekdayLocal: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"],
    sidebarTitle: "Events",
    groupHoliday: "Holidays",
    groupRitual: "Ritual",
    groupGeneral: "Selected day",
    today: "Today",
    eventsLabel: "events",
    ritualPicker: (dateKey, weekday) => `${dateKey} (${weekday}) add an event`,
    ritualWeekday: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"],
    monthLocale: "en-US",
    reminderSuffix: " min before",
    defaultEvent: "this event",
    ritualTooltip: (emoji) => `${emoji} ritual`,
    sync: "Sync",
    settingsTitle: "Settings",
    modal: {
      add: "Add Event",
      edit: "Edit Event",
      title: "Title",
      start: "Start",
      end: "End",
      allDay: "All day",
      location: "Location",
      reminder: "Reminder (minutes)",
      placeholderTitle: "Enter a title",
      placeholderTime: "e.g. 08:00",
      placeholderEndTime: "e.g. 09:00",
      placeholderLocation: "Enter a location",
      placeholderReminder: "e.g. 30 (minutes before)",
      cancel: "Cancel",
      save: "Save"
    },
    deleteModal: {
      title: "Delete Event",
      cancel: "Cancel",
      confirm: "Delete"
    },
    ritual: {
      title: "Pick an event to add",
      general: "General",
      record: "Record",
      workout: "Workout",
      project: "Project",
      dateText: (dateKey, weekday) => `${dateKey} (${weekday}) add an event`
    },
    context: {
      clearGeneral: "Clear general events",
      clearRitual: "Clear ritual events",
      clearAll: "Clear all events",
      label: (dateKey) => `${dateKey} · actions`
    },
    settings: {
      holidayLabel: "Show holidays",
      holidayHelp: "Show Google holidays on the calendar.",
      priorityLabel: "Holiday priority",
      priorityHelp: "Show holiday title first when mixed with general events.",
      languageLabel: "Language",
      languageHelp: "Switch calendar language."
    }
  },
  ko: {
    weekdayNames: ["일", "월", "화", "수", "목", "금", "토"],
    weekdayLocal: ["일", "월", "화", "수", "목", "금", "토"],
    sidebarTitle: "일정",
    groupHoliday: "공휴일",
    groupRitual: "Ritual",
    groupGeneral: "선택한 날",
    today: "오늘",
    eventsLabel: "개",
    ritualPicker: (dateKey, weekday) => `${dateKey}(${weekday}) 에 일정을 추가합니다.`,
    ritualWeekday: ["일", "월", "화", "수", "목", "금", "토"],
    monthLocale: "ko-KR",
    reminderSuffix: "분 전",
    defaultEvent: "이 일정",
    ritualTooltip: (emoji) => `${emoji} 리추얼`,
    sync: "동기화",
    settingsTitle: "설정",
    modal: {
      add: "일정 추가",
      edit: "일정 수정",
      title: "제목",
      start: "시작",
      end: "종료",
      allDay: "하루종일",
      location: "위치",
      reminder: "알림 (분)",
      placeholderTitle: "제목을 입력하세요",
      placeholderTime: "예: 08:00",
      placeholderEndTime: "예: 09:00",
      placeholderLocation: "장소를 입력하세요",
      placeholderReminder: "예: 30 (분 전)",
      cancel: "취소",
      save: "저장"
    },
    deleteModal: {
      title: "일정 삭제",
      cancel: "취소",
      confirm: "삭제"
    },
    ritual: {
      title: "추가할 일정을 선택하세요",
      general: "일반 일정",
      record: "Record",
      workout: "Workout",
      project: "Project",
      dateText: (dateKey, weekday) => `${dateKey}(${weekday}) 에 일정을 추가합니다.`
    },
    context: {
      clearGeneral: "일반 일정 지우기",
      clearRitual: "리추얼 일정 지우기",
      clearAll: "모든 일정 지우기",
      label: (dateKey) => `${dateKey} 일정 정리`
    },
    settings: {
      holidayLabel: "공휴일 표시",
      holidayHelp: "Google 공휴일을 달력에 노출합니다.",
      priorityLabel: "공휴일 우선 표시",
      priorityHelp: "공휴일과 일반일정이 같이 있을 때 공휴일 제목을 우선 보여줍니다.",
      languageLabel: "언어 / Language",
      languageHelp: "캘린더 표기를 영어/한국어로 전환합니다."
    }
  }
};

function t() {
  return i18n[settings.language] || i18n.en;
}

function loadSettings() {
  try {
    const raw = localStorage.getItem("ritualCalendar.settings");
    if (raw) {
      const parsed = JSON.parse(raw);
      settings = { ...settings, ...parsed };
    }
  } catch {
    // ignore parse errors
  }
}

function saveSettings() {
  try {
    localStorage.setItem("ritualCalendar.settings", JSON.stringify(settings));
  } catch {
    // ignore storage errors
  }
}

function syncSettingsUI() {
  if (toggleHoliday) toggleHoliday.checked = !!settings.showHolidays;
  if (toggleHolidayPriority) toggleHolidayPriority.checked = !!settings.holidayPriority;
}

function getVisibleEvents(key) {
  const list = events[key] || [];
  if (!settings.showHolidays) return list.filter(e => !e.isHoliday);
  return list;
}

function getRitualEmoji(title) {
  if (!title) return null;
  const trimmed = title.trim();
  const match = trimmed.match(/^#(\S+)/);
  if (!match) return null;
  const emoji = match[1];
  if (!ritualEmojis[emoji]) return null;
  return { emoji, html: ritualEmojis[emoji] };
}

function formatDateKey(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function parseDateKey(key) {
  const [y, m, d] = key.split("-").map(Number);
  return new Date(y, (m || 1) - 1, d || 1);
}

function formatDateLabel(key) {
  const d = parseDateKey(key);
  const strings = t();
  const weekday = strings.weekdayLocal[d.getDay()];
  return `${key}(${weekday})`;
}

function buildRange(evt, startKey) {
  const endKey = evt.endDateKey || startKey;
  const isAllDay = !!evt.allDay;
  const startLabel = formatDateLabel(startKey);
  const endLabel = formatDateLabel(endKey);
  const strings = t();
  const allDayLabel = strings.modal.allDay;
  if (isAllDay) {
    if (startKey === endKey) return `${startLabel} · ${allDayLabel}`;
    return `${startLabel} → ${endLabel} · ${allDayLabel}`;
  }
  const startTime = evt.startTime || evt.time || allDayLabel;
  const endTime = evt.endTime || startTime;
  if (startKey === endKey) return `${startLabel} · ${startTime} - ${endTime}`;
  return `${startLabel} ${startTime} → ${endLabel} ${endTime}`;
}

function setDateValue(input, key) {
  if (!input) return;
  try {
    const str = key || "";
    input.value = str;
  } catch {
    input.value = key;
  }
}

function openEventModal({ mode, id = null, title = "", time = "", endTime = "", dateKey, endDateKey = null, allDay = false, location = "", reminderMinutes = "" }) {
  const todayKey = formatDateKey(new Date());
  modalState = { mode, id, dateKey: dateKey || todayKey, endDateKey: endDateKey || dateKey || todayKey, allDay };
  const strings = t();
  modalTitleEl.textContent = mode === "create" ? strings.modal.add : strings.modal.edit;
  const startKey = dateKey || todayKey;
  const endKey = endDateKey || startKey;
  inputEventId.value = id || "";
  setDateValue(inputStartDate, startKey);
  setDateValue(inputEndDate, endKey);
  inputTitle.value = title;
  inputTime.value = time || "09:00";
  inputEndTime.value = endTime || "22:00";
  inputAllDay.checked = !!allDay;
  inputLocation.value = location || "";
  inputReminder.value = reminderMinutes ?? "";
  toggleTimeInputs();
  modalEvent.classList.remove("hidden");
  modalDelete.classList.add("hidden");
  modalBackdrop.classList.remove("hidden");
  inputTitle.focus();
}

function openDeleteModal({ id, title }) {
  modalState = { mode: "delete", id, deleteTitle: title };
  const strings = t();
  deleteText.textContent = settings.language === "ko"
    ? `"${title}" 일정을 삭제할까요?`
    : `Delete "${title}"?`;
  modalEvent.classList.add("hidden");
  modalDelete.classList.remove("hidden");
  modalBackdrop.classList.remove("hidden");
}

function closeModal() {
  modalBackdrop.classList.add("hidden");
}

function toggleTimeInputs() {
  const isAllDay = inputAllDay.checked;
  inputTime.disabled = isAllDay;
  inputEndTime.disabled = isAllDay;
  if (isAllDay) {
    inputTime.value = "";
    inputEndTime.value = "";
  }
}

function renderWeekdays() {
  const strings = t();
  weekdayRow.innerHTML = strings.weekdayNames
    .map(name => `<div class="weekday">${name}</div>`)
    .join("");
}

let actionMenuId = 0;

function createEventRow(evt, dateKey) {
  const row = document.createElement("div");
  row.className = `event ${evt.isHoliday ? "event-holiday" : ""}`;
  const id = `menu-${actionMenuId++}`;
  const eventId = evt.id || `${dateKey}-${evt.title}-${evt.time}`;
  const range = buildRange(evt, dateKey);
  const strings = t();
  const hasLocation = !!evt.location;
  const hasReminder = evt.reminderMinutes !== undefined && evt.reminderMinutes !== null && evt.reminderMinutes !== "";
  const isHoliday = !!evt.isHoliday;
  row.innerHTML = `
    <div class="event-color" style="background:${evt.color}"></div>
      <div class="event-main">
      <div class="event-title">${evt.title}</div>
      <div class="event-time">${range}</div>
      ${hasLocation ? `<div class="event-meta"><img src="./assets/map-pin.png" class="icon" alt="" />${evt.location}</div>` : ""}
      ${hasReminder ? `<div class="event-meta"><img src="./assets/bell.png" class="icon" alt="" />${evt.reminderMinutes}${strings.reminderSuffix}</div>` : ""}
    </div>
    <div class="event-actions">
      <button class="icon-btn ellipsis-btn" data-menu="${id}" aria-label="Actions">
        <img src="./assets/ellipsis.png" class="icon" alt="More" />
      </button>
      <div class="action-menu" id="${id}">
        <button class="icon-btn edit-btn"
                data-id="${eventId}"
                data-date="${dateKey}"
                data-end-date="${evt.endDateKey || dateKey}"
                data-time="${evt.startTime || evt.time || ''}"
                data-end-time="${evt.endTime || ''}"
                data-all-day="${evt.allDay ? "1" : "0"}"
                data-title="${evt.title}"
                data-location="${evt.location || ''}"
                data-reminder="${evt.reminderMinutes ?? ''}"
                aria-label="Edit">
          <img src="./assets/pencil.png" class="icon" alt="Edit" />
        </button>
        <button class="icon-btn delete-btn" data-id="${eventId}" aria-label="Delete">
          <img src="./assets/trash.png" class="icon" alt="Delete" />
        </button>
      </div>
    </div>`;
  return row;
}

function attachActionMenus() {
  const menus = document.querySelectorAll(".action-menu");
  const buttons = document.querySelectorAll(".ellipsis-btn");
  buttons.forEach(btn => {
    btn.onclick = () => {
      const targetId = btn.getAttribute("data-menu");
      menus.forEach(m => {
        if (m.id === targetId) {
          m.classList.toggle("open");
        } else {
          m.classList.remove("open");
        }
      });
    };
  });
  document.addEventListener("click", (e) => {
    if (!(e.target.closest && e.target.closest(".event-actions"))) {
      menus.forEach(m => m.classList.remove("open"));
    }
  }, { once: true });

  document.querySelectorAll(".edit-btn").forEach(btn => {
    btn.onclick = () => {
      const id = btn.getAttribute("data-id");
      const date = btn.getAttribute("data-date");
      const endDate = btn.getAttribute("data-end-date") || date;
      const currentTitle = btn.getAttribute("data-title");
      const currentTime = btn.getAttribute("data-time");
      const currentEndTime = btn.getAttribute("data-end-time");
      const allDay = btn.getAttribute("data-all-day") === "1";
      openEventModal({
        mode: "edit",
        id,
        dateKey: date,
        endDateKey: endDate,
        title: currentTitle,
        time: currentTime,
        endTime: currentEndTime,
        allDay,
        location: btn.getAttribute("data-location") || "",
        reminderMinutes: btn.getAttribute("data-reminder") || ""
      });
    };
  });

  document.querySelectorAll(".delete-btn").forEach(btn => {
    btn.onclick = () => {
      const id = btn.getAttribute("data-id");
      const strings = t();
      const title = btn.closest(".event")?.querySelector(".event-title")?.textContent || strings.defaultEvent;
      openDeleteModal({ id, title });
    };
  });
}

function renderEventsSidebar(dateKey, viewDate) {
  eventList.innerHTML = "";
  const todaysEvents = getVisibleEvents(dateKey);
  const strings = t();
  sidebarTitle.textContent = strings.sidebarTitle;

  const renderGroup = (label, items) => {
    if (!items.length) return;
    const header = document.createElement("div");
    header.className = "chip";
    header.textContent = label;
    eventList.appendChild(header);

    items.forEach(evts => {
      (Array.isArray(evts) ? evts : [evts]).forEach(evt => {
        eventList.appendChild(createEventRow(evt, dateKey));
      });
    });
  };

  const holidays = todaysEvents.filter(e => e.isHoliday);
  const rituals = todaysEvents.filter(e => !e.isHoliday && getRitualEmoji(e.title));
  const general = todaysEvents.filter(e => !e.isHoliday && !getRitualEmoji(e.title));

  renderGroup(strings.groupHoliday, holidays);
  renderGroup(strings.groupRitual, rituals);
  renderGroup(strings.groupGeneral, general);

  attachActionMenus();
}

function renderCalendar() {
  const viewDate = new Date(state.current);
  viewDate.setDate(1);
  const firstDay = viewDate.getDay();
  const month = viewDate.getMonth();
  const year = viewDate.getFullYear();

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const daysInPrevMonth = new Date(year, month, 0).getDate();
  const todayKey = formatDateKey(new Date());
  const strings = t();
  monthLabel.innerHTML = `${viewDate.toLocaleString(strings.monthLocale, { month: "long" })}<span class="year">${year}</span>`;

  const cells = [];
  for (let i = firstDay - 1; i >= 0; i--) {
    const dayNum = daysInPrevMonth - i;
    const date = new Date(year, month - 1, dayNum);
    cells.push({ date, outside: true });
  }

  for (let i = 1; i <= daysInMonth; i++) {
    const date = new Date(year, month, i);
    cells.push({ date, outside: false });
  }

  while (cells.length % 7 !== 0) {
    const date = new Date(year, month + 1, cells.length - daysInMonth - firstDay + 1);
    cells.push({ date, outside: true });
  }

  dayGrid.innerHTML = cells
    .map(cell => {
      const key = formatDateKey(cell.date);
      const dayEvents = getVisibleEvents(key);
      const holidayEvents = dayEvents.filter(evt => evt.isHoliday);
      const ritualEvents = dayEvents.filter(evt => !evt.isHoliday && getRitualEmoji(evt.title));
      const generalEvents = dayEvents.filter(evt => !evt.isHoliday && !getRitualEmoji(evt.title));
      const isToday = key === todayKey;
      const isSelected = state.selected && formatDateKey(state.selected) === key;
      const hasEvents = ritualEvents.length > 0 || generalEvents.length > 0 || holidayEvents.length > 0;
      const isFirst = cell.date.getDate() === 1;
      const ritualSet = new Set(ritualEvents.map(evt => getRitualEmoji(evt.title)?.emoji).filter(Boolean));
      const ritualCount = ritualSet.size;
      const hasRitualTrio = ["✏️", "🔥", "🚀"].every(r => ritualSet.has(r));
      const ritualClass = hasRitualTrio
        ? "prism"
        : ritualCount === 2
          ? "gold"
          : ritualCount === 1
            ? "silver"
            : "";
      let badges = "";
      let generalLabelTop = "";
      let generalList = "";
      const combinedGeneral = settings.holidayPriority ? [...holidayEvents, ...generalEvents] : [...generalEvents, ...holidayEvents];
      const holidayFirst = settings.holidayPriority && holidayEvents.length > 0;
      if (combinedGeneral.length) {
        const count = combinedGeneral.length;
        if (count > 1) {
          const extra = count - 1;
          generalLabelTop = `<span class="general-count" title="${count} ${strings.eventsLabel}">+${extra}</span>`;
        }
        const firstTitle = combinedGeneral[0].title || "Event";
        generalList = `<div class="general-list ${holidayFirst ? "holiday" : ""}" title="${firstTitle}">${firstTitle}</div>`;
      } else {
        // Preserve vertical rhythm when no general events
        generalList = `<div class="general-list spacer"></div>`;
      }

      if (ritualEvents.length) {
        const dots = ritualEvents
          .map(evt => {
            const ritual = getRitualEmoji(evt.title);
            if (ritual) {
              const strings = t();
              return `<span class="emoji-badge" title="${strings.ritualTooltip(ritual.emoji)}">${ritual.html}</span>`;
            }
            return `<span class="dot"></span>`;
          })
          .join("");
        badges = `<div class="badge">${dots}</div>`;
      } else {
        // Preserve height when no rituals
        badges = `<div class="badge spacer"></div>`;
      }
      return `
        <div class="day ${cell.outside ? "outside" : ""} ${isToday ? "today" : ""} ${isSelected ? "selected" : ""} ${isFirst ? "first-of-month" : ""} ${ritualClass}" data-date="${key}">
          <div class="day-header">
            <div class="day-number">${cell.date.getDate()}</div>
            ${generalLabelTop}
          </div>
          ${generalList}
          ${badges}
        </div>`;
    })
    .join("");

  dayGrid.querySelectorAll(".day").forEach(dayEl => {
    dayEl.addEventListener("click", () => {
      state.selected = parseDateKey(dayEl.dataset.date);
      state.selectedKey = dayEl.dataset.date;
      renderCalendar();
      renderEventsSidebar(dayEl.dataset.date, state.current);
    });
    dayEl.addEventListener("dblclick", (e) => {
      e.stopPropagation();
      const key = dayEl.dataset.date;
      state.selected = parseDateKey(key);
      state.selectedKey = key;
      renderCalendar();
      renderEventsSidebar(key, state.current);
      openRitualPicker(key);
    });
    dayEl.addEventListener("contextmenu", (e) => {
      e.preventDefault();
      const key = dayEl.dataset.date;
      openDayContextMenu(key, e.clientX, e.clientY);
    });
  });

  const selectedKey = state.selected ? formatDateKey(state.selected) : todayKey;
  if (!state.selectedKey && state.selected) state.selectedKey = selectedKey;
  renderEventsSidebar(selectedKey, viewDate);
}

document.getElementById("prevMonth").addEventListener("click", () => {
  state.current.setMonth(state.current.getMonth() - 1);
  renderCalendar();
  ensureRangeForView();
});

document.getElementById("nextMonth").addEventListener("click", () => {
  state.current.setMonth(state.current.getMonth() + 1);
  renderCalendar();
});

document.getElementById("todayBtn").addEventListener("click", () => {
  state.current = new Date();
  state.selected = new Date();
  state.selectedKey = formatDateKey(state.selected);
  renderCalendar();
});

document.getElementById("newEvent").addEventListener("click", () => {
  const key = state.selectedKey || formatDateKey(state.selected || new Date());
  openEventModal({ mode: "create", dateKey: key });
});

syncBtn.addEventListener("click", () => {
  if (window.chrome?.webview?.postMessage) {
    window.chrome.webview.postMessage({ kind: "sync" });
  } else {
    renderCalendar();
  }
});

function ensureRangeForView() {
  if (!window.chrome?.webview?.postMessage) return;
  const start = new Date(state.current.getFullYear(), state.current.getMonth(), 1);
  const key = formatDateKey(start);
  window.chrome.webview.postMessage({ kind: "ensureRange", from: key });
}

function openRitualPicker(dateKey) {
  ritualState = { dateKey: dateKey || formatDateKey(new Date()) };
  if (ritualDateText) {
    const parsed = parseDateKey(ritualState.dateKey);
    const strings = t();
    const weekday = strings.ritualWeekday[parsed.getDay()];
    ritualDateText.textContent = strings.ritual.dateText(ritualState.dateKey, weekday);
  }
  ritualBackdrop.classList.remove("hidden");
}

function closeRitualPicker() {
  ritualBackdrop.classList.add("hidden");
  ritualState = { dateKey: null };
}

function openDayContextMenu(dateKey, x, y) {
  contextMenuState = { dateKey };
  if (!dayContextMenu) return;
  const strings = t();
  if (contextDateLabel) contextDateLabel.textContent = strings.context.label(dateKey);
  dayContextMenu.classList.remove("hidden");
}

function closeDayContextMenu() {
  contextMenuState = { dateKey: null };
  if (dayContextMenu) dayContextMenu.classList.add("hidden");
}

function deleteEventsForDate(dateKey, mode) {
  const list = events[dateKey] || [];
  const toDelete = list.filter(evt => {
    if (evt.isHoliday) return false;
    const isRitual = !!getRitualEmoji(evt.title);
    if (mode === "general") return !isRitual;
    if (mode === "ritual") return isRitual;
    return true;
  });

  // Remove locally
  events[dateKey] = list.filter(evt => !toDelete.includes(evt));

  // Notify host
  if (window.chrome?.webview?.postMessage) {
    toDelete.forEach(evt => {
      if (evt.id) {
        window.chrome.webview.postMessage({ kind: "deleteEvent", id: evt.id });
      }
    });
  }

  renderCalendar();
  renderEventsSidebar(dateKey, state.current);
}

function createRitualEvent(emoji) {
  const dateKey = ritualState.dateKey || formatDateKey(new Date());
  const title = `#${emoji}`;
  const payload = { kind: "createEvent", title, time: "", endTime: "", dateKey, endDateKey: dateKey, allDay: true, location: "", reminderMinutes: null };
  if (window.chrome?.webview?.postMessage) {
    window.chrome.webview.postMessage(payload);
  } else {
    events[dateKey] = events[dateKey] || [];
    events[dateKey].push({
      id: `${dateKey}-${emoji}-${Date.now()}`,
      title,
      time: "",
      endDateKey: dateKey,
      allDay: true,
      startDateKey: dateKey,
      location: "",
      reminderMinutes: null,
      color: "#22d3ee"
    });
    renderCalendar();
    renderEventsSidebar(dateKey, state.current);
  }
  closeRitualPicker();
}

// Receive events from the host (WPF) via WebView2 postMessage
window.chrome?.webview?.addEventListener("message", (event) => {
  const data = event.data;
  if (!data || data.kind !== "events" || !Array.isArray(data.items)) return;
  const nextEvents = {};
  data.items.forEach(item => {
    const key = item.startDateKey || item.dateKey;
    if (!key) return;
    nextEvents[key] = nextEvents[key] || [];
    const isHoliday = !!item.isHoliday;
    nextEvents[key].push({
      id: item.id || `${key}-${item.title}-${item.time}`,
      title: item.title || "Event",
      startDateKey: key,
      endDateKey: item.endDateKey || key,
      startTime: item.startTime || item.time || "",
      endTime: item.endTime || "",
      allDay: item.allDay || false,
      location: item.location || "",
      reminderMinutes: item.reminderMinutes,
      isHoliday,
      calendarId: item.calendarId,
      color: "#22d3ee"
    });
  });
  events = nextEvents;
  renderCalendar();
  const selectedKey = state.selected ? formatDateKey(state.selected) : formatDateKey(new Date());
  renderEventsSidebar(selectedKey, state.current);
});

function applyLanguageTexts() {
  const strings = t();
  const todayButton = document.getElementById("todayBtn");
  if (todayButton) todayButton.textContent = strings.today;
  if (modalTitleEl) modalTitleEl.textContent = modalState.mode === "create" ? strings.modal.add : strings.modal.edit;
  if (modalCancel) modalCancel.textContent = strings.modal.cancel;
  if (modalSubmit) modalSubmit.textContent = strings.modal.save;
  if (deleteTitleEl) deleteTitleEl.textContent = strings.deleteModal.title;
  if (deleteCancel) deleteCancel.textContent = strings.deleteModal.cancel;
  if (deleteConfirm) deleteConfirm.textContent = strings.deleteModal.confirm;
  if (modalState.mode === "delete" && deleteText) {
    const titleText = modalState.deleteTitle || modalState.id || "";
    deleteText.textContent = settings.language === "ko"
      ? `"${titleText}" 일정을 삭제할까요?`
      : `Delete "${titleText}"?`;
  }
  if (lblTitle) lblTitle.textContent = strings.modal.title;
  if (lblStart) lblStart.querySelector("span").textContent = strings.modal.start;
  if (lblEnd) lblEnd.querySelector("span").textContent = strings.modal.end;
  if (lblAllDay) lblAllDay.textContent = strings.modal.allDay;
  if (lblLocation) lblLocation.querySelector("span").textContent = strings.modal.location;
  if (lblReminder) lblReminder.querySelector("span").textContent = strings.modal.reminder;
  if (inputTitle) inputTitle.placeholder = strings.modal.placeholderTitle;
  if (inputTime) inputTime.placeholder = strings.modal.placeholderTime;
  if (inputEndTime) inputEndTime.placeholder = strings.modal.placeholderEndTime;
  if (inputLocation) inputLocation.placeholder = strings.modal.placeholderLocation;
  if (inputReminder) inputReminder.placeholder = strings.modal.placeholderReminder;
  if (ritualTitle) ritualTitle.textContent = strings.ritual.title;
  if (ritualGeneralLabel) ritualGeneralLabel.textContent = strings.ritual.general;
  if (ritualRecordLabel) ritualRecordLabel.textContent = strings.ritual.record;
  if (ritualWorkoutLabel) ritualWorkoutLabel.textContent = strings.ritual.workout;
  if (ritualProjectLabel) ritualProjectLabel.textContent = strings.ritual.project;
  if (ctxClearGeneral) ctxClearGeneral.textContent = strings.context.clearGeneral;
  if (ctxClearRitual) ctxClearRitual.textContent = strings.context.clearRitual;
  if (ctxClearAll) ctxClearAll.textContent = strings.context.clearAll;
  if (settingsTitle) settingsTitle.textContent = strings.settingsTitle;
  if (settingsHolidayLabel) settingsHolidayLabel.textContent = strings.settings.holidayLabel;
  if (settingsHolidayHelp) settingsHolidayHelp.textContent = strings.settings.holidayHelp;
  if (settingsPriorityLabel) settingsPriorityLabel.textContent = strings.settings.priorityLabel;
  if (settingsPriorityHelp) settingsPriorityHelp.textContent = strings.settings.priorityHelp;
  if (settingsLanguageLabel) settingsLanguageLabel.textContent = strings.settings.languageLabel;
  if (settingsLanguageHelp) settingsLanguageHelp.textContent = strings.settings.languageHelp;
  if (languageSelect && languageSelect.options.length >= 2) {
    languageSelect.options[0].textContent = settings.language === "ko" ? "영어" : "English";
    languageSelect.options[1].textContent = settings.language === "ko" ? "한국어" : "Korean";
  }
  if (syncBtn) syncBtn.title = strings.sync;
  if (document.getElementById("menuBtn")) document.getElementById("menuBtn").title = strings.settings.languageHelp;
}

modalCancel.addEventListener("click", closeModal);
modalClose.addEventListener("click", closeModal);
deleteClose.addEventListener("click", closeModal);
deleteCancel.addEventListener("click", closeModal);
inputAllDay.addEventListener("change", toggleTimeInputs);
ritualClose.addEventListener("click", closeRitualPicker);
ritualButtons().forEach(btn => {
  btn.addEventListener("click", () => {
    const emoji = btn.getAttribute("data-ritual");
    const kind = btn.getAttribute("data-kind");
    const dateKey = ritualState.dateKey || formatDateKey(new Date());
    if (kind === "general") {
      closeRitualPicker();
      openEventModal({ mode: "create", dateKey });
      return;
    }
    if (!emoji) return;
    createRitualEvent(emoji);
  });
});

contextItems().forEach(btn => {
  btn.addEventListener("click", () => {
    const action = btn.getAttribute("data-action");
    const dateKey = contextMenuState.dateKey;
    if (!dateKey) return closeDayContextMenu();
    if (action === "clear-general") deleteEventsForDate(dateKey, "general");
    else if (action === "clear-ritual") deleteEventsForDate(dateKey, "ritual");
    else if (action === "clear-all") deleteEventsForDate(dateKey, "all");
    closeDayContextMenu();
  });
});

document.addEventListener("click", (e) => {
  if (!dayContextMenu || dayContextMenu.classList.contains("hidden")) return;
  if (!dayContextMenu.contains(e.target)) closeDayContextMenu();
});
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") closeDayContextMenu();
});

if (contextClose) {
  contextClose.addEventListener("click", closeDayContextMenu);
}

function openSettings() {
  settingsBackdrop?.classList.remove("hidden");
}

function closeSettings() {
  settingsBackdrop?.classList.add("hidden");
}

if (menuBtn) {
  menuBtn.addEventListener("click", () => {
    syncSettingsUI();
    openSettings();
  });
}
if (settingsClose) settingsClose.addEventListener("click", closeSettings);
  if (settingsBackdrop) {
    settingsBackdrop.addEventListener("click", (e) => {
      if (e.target === settingsBackdrop) closeSettings();
    });
  }
if (toggleHoliday) {
  toggleHoliday.addEventListener("change", () => {
    settings.showHolidays = toggleHoliday.checked;
    saveSettings();
    renderCalendar();
    const selectedKey = state.selected ? formatDateKey(state.selected) : formatDateKey(new Date());
    renderEventsSidebar(selectedKey, state.current);
  });
}
if (toggleHolidayPriority) {
  toggleHolidayPriority.addEventListener("change", () => {
    settings.holidayPriority = toggleHolidayPriority.checked;
    saveSettings();
    renderCalendar();
    const selectedKey = state.selected ? formatDateKey(state.selected) : formatDateKey(new Date());
    renderEventsSidebar(selectedKey, state.current);
  });
}
if (languageSelect) {
  languageSelect.addEventListener("change", () => {
    settings.language = languageSelect.value || "en";
    saveSettings();
    applyLanguageTexts();
    renderWeekdays();
    renderCalendar();
    const selectedKey = state.selected ? formatDateKey(state.selected) : formatDateKey(new Date());
    renderEventsSidebar(selectedKey, state.current);
  });
}

modalForm.addEventListener("submit", (e) => {
  e.preventDefault();
  const title = inputTitle.value.trim();
  const time = inputTime.value.trim();
  const endTime = inputEndTime.value.trim();
  const dateKey = inputStartDate.value || formatDateKey(new Date());
  const endDateKey = inputEndDate.value || dateKey;
  const allDay = inputAllDay.checked;
  const location = inputLocation.value.trim();
  const reminderRaw = inputReminder.value ? parseInt(inputReminder.value, 10) : null;
  const reminderMinutes = Number.isFinite(reminderRaw) ? reminderRaw : null;
  if (!title) return;
  if (window.chrome?.webview?.postMessage) {
    if (modalState.mode === "create") {
      window.chrome.webview.postMessage({ kind: "createEvent", title, time, endTime, dateKey, endDateKey, allDay, location, reminderMinutes });
    } else {
      window.chrome.webview.postMessage({ kind: "editEvent", id: modalState.id, title, time, endTime, dateKey, endDateKey, allDay, location, reminderMinutes });
    }
  } else {
    events[dateKey] = events[dateKey] || [];
    const existingIndex = events[dateKey].findIndex(e => e.id === modalState.id);
    const payload = { id: modalState.id || `${dateKey}-${title}-${Date.now()}`, title, time, endTime, endDateKey, allDay, startDateKey: dateKey, location, reminderMinutes, color: "#22d3ee" };
    if (modalState.mode === "edit" && existingIndex >= 0) {
      events[dateKey][existingIndex] = { ...events[dateKey][existingIndex], ...payload };
    } else {
      events[dateKey].push(payload);
    }
    renderCalendar();
    renderEventsSidebar(dateKey, state.current);
  }
  closeModal();
});

deleteConfirm.addEventListener("click", () => {
  if (window.chrome?.webview?.postMessage) {
    window.chrome.webview.postMessage({ kind: "deleteEvent", id: modalState.id });
  } else {
    Object.keys(events).forEach(key => {
      events[key] = (events[key] || []).filter(e => e.id !== modalState.id);
    });
    renderCalendar();
    renderEventsSidebar(state.selected ? formatDateKey(state.selected) : formatDateKey(new Date()), state.current);
  }
  closeModal();
});

loadSettings();
syncSettingsUI();
applyLanguageTexts();
renderWeekdays();
renderCalendar();
