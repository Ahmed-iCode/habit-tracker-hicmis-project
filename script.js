// أيام الأسبوع
const DAYS_SHORT = ["س", "ح", "ن", "ث", "ر", "خ", "ج"];
const DAYS_FULL = [
  "السبت",
  "الأحد",
  "الإثنين",
  "الثلاثاء",
  "الأربعاء",
  "الخميس",
  "الجمعة",
];

// معرفة رقم اليوم الحالي بحيث يبدأ الأسبوع يوم السبت (0)
const jsDay = new Date().getDay();
const TODAY_INDEX = (jsDay + 1) % 7;

// تصنيفات العادات
const CATEGORIES = {
  health: { label: "صحة ولياقة", className: "cat-health" },
  work: { label: "إنتاجية وعمل", className: "cat-work" },
  self: { label: "تطوير ذاتي", className: "cat-self" },
};

let habits = [];
let currentFilter = "all";

// 1. تحميل البيانات
function loadData() {
  try {
    const saved = localStorage.getItem("masar_habits_v3");
    habits = saved
      ? JSON.parse(saved)
      : JSON.parse(JSON.stringify(DEFAULT_HABITS));

    const savedTheme = localStorage.getItem("masar_theme_v3") || "dark";
    if (savedTheme === "light") {
      document.body.classList.add("light");
      document.getElementById("themeBtn").textContent = "🌙";
    } else {
      document.body.classList.remove("light");
      document.getElementById("themeBtn").textContent = "☀️";
    }
  } catch (e) {
    habits = JSON.parse(JSON.stringify(DEFAULT_HABITS));
  }
}

// 2. حفظ البيانات في المتصفح
function saveData() {
  try {
    localStorage.setItem("masar_habits_v3", JSON.stringify(habits));
  } catch (e) {}
}

// 3. عرض البطاقات وتحديث الواجهة
function renderHabits() {
  const container = document.getElementById("habitsContainer");
  const hideCompleted = document.getElementById("hideCompletedCheck").checked;
  document.getElementById("todayNameBadge").textContent =
    "اليوم: " + DAYS_FULL[TODAY_INDEX];

  const filtered = habits.filter((h) => {
    const matchCat = currentFilter === "all" || h.category === currentFilter;
    const matchFocus = !hideCompleted || !h.days[TODAY_INDEX];
    return matchCat && matchFocus;
  });

  if (filtered.length === 0) {
    container.innerHTML = `<div class="empty-box">لا توجد عادات مطابقة للعرض حالياً.</div>`;
  } else {
    container.innerHTML = filtered
      .map((habit) => {
        const isDoneToday = Boolean(habit.days[TODAY_INDEX]);
        const catInfo = CATEGORIES[habit.category] || CATEGORIES.self;
        const totalDoneWeek = habit.days.filter(Boolean).length;

        const weekButtonsHTML = DAYS_SHORT.map((dayChar, idx) => {
          const checkedClass = habit.days[idx] ? "checked" : "";
          const todayClass = idx === TODAY_INDEX ? "is-today" : "";
          return `
              <button class="day-btn ${checkedClass} ${todayClass}"
                      onclick="toggleDay(${habit.id}, ${idx})"
                      title="${DAYS_FULL[idx]}">
                <span>${dayChar}</span>
                <span class="day-dot">${habit.days[idx] ? "✓" : "·"}</span>
              </button>
            `;
        }).join("");

        return `
            <article class="habit-card ${isDoneToday ? "done-today" : ""}">
              <div class="habit-top">
                <div class="habit-info">
                  <div class="habit-emoji">${habit.icon}</div>
                  <div>
                    <h3 class="habit-title">${habit.title}</h3>
                    <span class="cat-badge ${catInfo.className}">${catInfo.label}</span>
                  </div>
                </div>
                <button class="btn-delete" onclick="deleteHabit(${habit.id})" title="حذف العادة">✕</button>
              </div>

              <div class="week-strip">
                ${weekButtonsHTML}
              </div>

              <div class="habit-footer">
                <span class="streak-tag">🔥 ${totalDoneWeek} / 7 أيام هذا الأسبوع</span>
                <button class="btn-check-today ${isDoneToday ? "done" : ""}"
                        onclick="toggleToday(${habit.id})">
                  ${isDoneToday ? "✓ مكتملة اليوم" : "إنجاز اليوم"}
                </button>
              </div>
            </article>
          `;
      })
      .join("");
  }

  updateStats();
}

// 4. تحديث شريط التقدم والحلقة الدائرية والإحصائيات
function updateStats() {
  const totalHabits = habits.length;
  const doneToday = habits.filter((h) => h.days[TODAY_INDEX]).length;
  const percentToday =
    totalHabits > 0 ? Math.round((doneToday / totalHabits) * 100) : 0;

  document.getElementById("progressBar").style.width = percentToday + "%";
  document.getElementById("progressText").textContent =
    `${doneToday} من ${totalHabits} مكتملة اليوم`;
  document.getElementById("progressPercent").textContent = `${percentToday}%`;
  document.getElementById("ringCount").textContent =
    `${doneToday}/${totalHabits}`;

  // محيط الدائرة (2 * PI * 42 ≈ 264)
  const circumference = 264;
  const offset = circumference - (percentToday / 100) * circumference;
  document.getElementById("ringMeter").style.strokeDashoffset = offset;

  // الرسائل التحفيزية
  const titleEl = document.getElementById("motivationTitle");
  const subEl = document.getElementById("motivationSub");
  if (totalHabits === 0) {
    titleEl.textContent = "أضف عادتك الأولى الآن!";
    subEl.textContent = 'اضغط على زر "+ عادة جديدة" في الأعلى للبدء.';
  } else if (percentToday === 100) {
    titleEl.textContent = "أحسنت! أكملت جميع عادات اليوم 🎉";
    subEl.textContent = "استمرارك اليومي يصنع نجاحك على المدى الطويل.";
  } else if (percentToday >= 50) {
    titleEl.textContent = "أنت في منتصف الطريق، استمر! 💪";
    subEl.textContent = "خطوات قليلة تفصلك عن إتمام جميع مهامك اليومية.";
  } else {
    titleEl.textContent = "يوم جديد مليء بالفرص 🌱";
    subEl.textContent = "ابدأ بأبسط عادة اليوم لتحفيز طاقتك.";
  }

  // إحصائيات الأسبوع
  const totalWeekChecks = habits.reduce(
    (sum, h) => sum + h.days.filter(Boolean).length,
    0,
  );
  const maxWeekPossible = totalHabits * 7;
  const weeklyRate =
    maxWeekPossible > 0
      ? Math.round((totalWeekChecks / maxWeekPossible) * 100)
      : 0;

  document.getElementById("weeklyTotalStat").textContent = totalWeekChecks;
  document.getElementById("weeklyRateStat").textContent = weeklyRate + "%";
}

// 5. تبديل إنجاز يوم محدد أو اليوم الحالي
function toggleDay(habitId, dayIndex) {
  const habit = habits.find((h) => h.id === habitId);
  if (!habit) return;
  habit.days[dayIndex] = !habit.days[dayIndex];
  saveData();
  renderHabits();
}

function toggleToday(habitId) {
  toggleDay(habitId, TODAY_INDEX);
}

// 6. فتح وإغلاق نافذة الإضافة
function openModal() {
  document.getElementById("habitModal").classList.add("open");
  setTimeout(() => document.getElementById("habitName").focus(), 80);
}

function closeModal() {
  document.getElementById("habitModal").classList.remove("open");
}

function handleBackdropClick(event) {
  if (event.target.id === "habitModal") {
    closeModal();
  }
}

// 7. إضافة عادة جديدة
function addHabit(event) {
  event.preventDefault();
  const nameInput = document.getElementById("habitName");
  const catInput = document.getElementById("habitCat");
  const iconInput = document.getElementById("habitIcon");

  const title = nameInput.value.trim();
  if (!title) return;

  const newHabit = {
    id: Date.now(),
    title: title,
    category: catInput.value,
    icon: iconInput.value,
    days: [false, false, false, false, false, false, false],
  };

  habits.unshift(newHabit);
  saveData();
  renderHabits();

  nameInput.value = "";
  closeModal();
}

// 8. حذف عادة
function deleteHabit(habitId) {
  habits = habits.filter((h) => h.id !== habitId);
  saveData();
  renderHabits();
}

// 9. تصفية العادات حسب الفئة
function setFilter(category, btnEl) {
  currentFilter = category;
  document
    .querySelectorAll(".filter-btn")
    .forEach((b) => b.classList.remove("active"));
  btnEl.classList.add("active");
  renderHabits();
}

// 10. تبديل الوضع الليلي والنهاري
function toggleTheme() {
  const isLight = document.body.classList.toggle("light");
  document.getElementById("themeBtn").textContent = isLight ? "🌙" : "☀️";
  try {
    localStorage.setItem("masar_theme_v3", isLight ? "light" : "dark");
  } catch (e) {}
}

// تشغيل التطبيق عند فتح الصفحة
loadData();
renderHabits();
