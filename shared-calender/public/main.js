let events = [];
let currentUserId = null;

// RenderのURLに変更してください
const API_URL = "https://one4-1agj.onrender.com"; // 本番環境
// const API_URL = "http://localhost:3000"; // ローカル環境

// ユーザーIDの取得または生成
function getUserId() {
  let userId = localStorage.getItem('calendarUserId');
  if (!userId) {
    // ランダムなIDを生成（例: user_1234567890）
    userId = 'user_' + Date.now() + Math.random().toString(36).substr(2, 9);
    localStorage.setItem('calendarUserId', userId);
    console.log('新しいユーザーIDを生成しました: - main.js:15', userId);
  }
  return userId;
}

document.addEventListener("DOMContentLoaded", () => {
  // ユーザーIDを取得
  currentUserId = getUserId();
  
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
    try {
      const res = await fetch(`${API_URL}/events`);
      if (!res.ok) throw new Error('Failed to fetch events');
      events = await res.json();
      renderCalendar();
    } catch (error) {
      console.error('イベント取得エラー: - main.js:42', error);
      renderCalendar();
    }
  }

  // ===== データ保存 =====
  async function addEvent(date, startTime, endTime, title, type) {
    try {
      const res = await fetch(`${API_URL}/events`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          date, 
          startTime, 
          endTime, 
          title, 
          type,
          userId: currentUserId // ユーザーIDを送信
        })
      });
      if (!res.ok) throw new Error('Failed to add event');
      const newEvent = await res.json();
      events.push(newEvent);
      renderCalendar();
    } catch (error) {
      console.error('イベント追加エラー: - main.js:67', error);
      alert('予定の追加に失敗しました。もう一度お試しください。');
    }
  }

  async function deleteEvent(id) {
    try {
      await fetch(`${API_URL}/events/${id}`, { method: "DELETE" });
      events = events.filter(e => e.id !== id);
      renderCalendar();
    } catch (error) {
      console.error('イベント削除エラー: - main.js:78', error);
      alert('予定の削除に失敗しました。');
    }
  }

  // ===== 自動更新機能（5秒ごと）=====
  setInterval(() => {
    loadEvents();
  }, 5000);

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
        // プライベート予定の表示制御
        if (ev.type === "private") {
          // 自分のプライベート予定のみ表示
          if (ev.userId !== currentUserId) return;
        }
        
        // プライベートモードでは公開予定を非表示
        if (isPrivateMode && ev.type === "public") return;
        
        if (ev.date !== dateStr) return;

        const evDiv = document.createElement("div");
        evDiv.className = `event ${ev.type}`;
        evDiv.textContent = `${ev.startTime}-${ev.endTime} ${ev.title}`;

        const del = document.createElement("button");
        del.textContent = "×";
        del.className = "delete-btn";
        
        // 自分の予定のみ削除可能
        if (ev.type === "public" || ev.userId === currentUserId) {
          del.onclick = e => { e.stopPropagation(); deleteEvent(ev.id); };
          evDiv.appendChild(del);
        }

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

  // 初回読み込み
  loadEvents();
});