let events = [];

const API_URL = "http://localhost:3000"; // サーバーURL

document.addEventListener("DOMContentLoaded", () => {
  const calendar = document.getElementById("calendar");
  const form = document.getElementById("eventForm");
  const dateInput = document.getElementById("date");
  const startTimeInput = document.getElementById("startTime");
  const endTimeInput = document.getElementById("endTime");
  const titleInput = document.getElementById("title");
  const typeSelect = document.getElementById("type");
  const privateToggle = document.getElementById("privateModeToggle");
  const modeLabel = document.getElementById("modeLabel");

  // ===== データ取得 =====
  async function loadEvents() {
    const res = await fetch(`${API_URL}/events`);
    events = await res.json();
    renderCalendar();
  }

  // ===== データ保存 =====
  async function addEvent(date, startTime, endTime, title, type) {
    const res = await fetch(`${API_URL}/events`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ date, startTime, endTime, title, type })
    });
    const newEvent = await res.json();
    events.push(newEvent);
    renderCalendar();
  }

  async function deleteEvent(id) {
    await fetch(`${API_URL}/events/${id}`, { method: "DELETE" });
    events = events.filter(e => e.id !== id);
    renderCalendar();
  }

  // ===== プライベートモード切替 =====
  privateToggle.addEventListener("change", () => {
    modeLabel.textContent = privateToggle.checked
      ? "プライベートモード"
      : "共有モード";
    renderCalendar();
  });

  // ===== カレンダー描画 =====
  function renderCalendar() {
    calendar.innerHTML = "";

    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();

    const firstDay = new Date(year, month, 1).getDay();
    const lastDate = new Date(year, month + 1, 0).getDate();

    const table = document.createElement("table");
    const header = document.createElement("tr");
    ["日","月","火","水","木","金","土"].forEach(d => {
      const th = document.createElement("th");
      th.textContent = d;
      header.appendChild(th);
    });
    table.appendChild(header);

    let tr = document.createElement("tr");
    for (let i = 0; i < firstDay; i++) tr.appendChild(document.createElement("td"));

    const isPrivateMode = privateToggle.checked;

    for (let day = 1; day <= lastDate; day++) {
      const td = document.createElement("td");

      const dayNum = document.createElement("div");
      dayNum.className = "day-number";
      dayNum.textContent = String(day);
      td.appendChild(dayNum);

      const mm = String(month + 1).padStart(2, "0");
      const dd = String(day).padStart(2, "0");
      const dateStr = `${year}-${mm}-${dd}`;

      td.addEventListener("click", () => { dateInput.value = dateStr; });

      events.forEach(ev => {
        if (!isPrivateMode && ev.type === "private") return;
        if (ev.date !== dateStr) return;

        const evDiv = document.createElement("div");
        evDiv.className = `event ${ev.type}`;
        evDiv.textContent = `${ev.startTime}-${ev.endTime} ${ev.title}`;

        const del = document.createElement("button");
        del.textContent = "×";
        del.className = "delete-btn";
        del.onclick = e => { e.stopPropagation(); deleteEvent(ev.id); };

        evDiv.appendChild(del);
        td.appendChild(evDiv);
      });

      tr.appendChild(td);
      if ((firstDay + day) % 7 === 0) { table.appendChild(tr); tr = document.createElement("tr"); }
    }

    table.appendChild(tr);
    calendar.appendChild(table);
  }

  form.addEventListener("submit", e => {
    e.preventDefault();
    addEvent(dateInput.value, startTimeInput.value, endTimeInput.value, titleInput.value, typeSelect.value);
    titleInput.value = "";
  });

  loadEvents();
});
