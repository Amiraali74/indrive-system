
const salaryForm = document.getElementById("salaryForm");

const workDate = document.getElementById("workDate");
const dayType = document.getElementById("dayType");
const workFields = document.getElementById("workFields");

const hoursInput = document.getElementById("hours");
const moneyInput = document.getElementById("money");
const banzenInput = document.getElementById("banzen");

const saveButton = document.getElementById("saveButton");
const cancelEdit = document.getElementById("cancelEdit");

const recordsList = document.getElementById("recordsList");
const monthFilter = document.getElementById("monthFilter");
const dailyComparison = document.getElementById("dailyComparison");

const celebrationOverlay = document.getElementById("celebrationOverlay");
const celebrationBox = document.getElementById("celebrationBox");
const celebrationEmoji = document.getElementById("celebrationEmoji");
const celebrationTitle = document.getElementById("celebrationTitle");
const celebrationText = document.getElementById("celebrationText");
const celebrationClose = document.getElementById("celebrationClose");

const STORAGE_KEY = "hossam_fandrive_records_v1";

let records = [];
let editingDate = null;
let showingAll = false;
let celebrationTimer = null;
let celebrationClosingTimer = null;

// الحصول على تاريخ اليوم بالتوقيت المحلي
function getLocalDate() {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
}

function getCurrentMonth() {
    return getLocalDate().slice(0, 7);
}

// تنسيق التاريخ
function formatDate(date) {
    if (!date) return "";

    const [year, month, day] = date.split("-");

    return `${day}/${month}/${year}`;
}

// تنسيق المبالغ
function moneyFormat(value) {
    return Number(value).toLocaleString("ar-EG", {
        maximumFractionDigits: 2
    }) + " ج";
}

// تحميل السجل من المتصفح
function loadRecords() {
    try {
        const saved = localStorage.getItem(STORAGE_KEY);

        if (saved === null) {
            records = [];
            return;
        }

        const parsed = JSON.parse(saved);

        if (!Array.isArray(parsed)) {
            throw new Error("بيانات السجل غير صالحة");
        }

        records = parsed.filter(record =>
            record &&
            typeof record.date === "string" &&
            /^\d{4}-\d{2}-\d{2}$/.test(record.date) &&
            ["work", "holiday"].includes(record.type)
        );
    } catch (error) {
        records = [];

        alert(
            "تعذر قراءة السجل المحفوظ. لم يتم حذف البيانات الموجودة في المتصفح."
        );
    }
}

// حفظ السجل
function saveRecords() {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
        return true;
    } catch (error) {
        alert(
            "تعذر حفظ البيانات. تأكد أن المتصفح يسمح بالتخزين."
        );

        return false;
    }
}

// تحديث تاريخ اليوم في الهيدر
function updateToday() {
    document.getElementById("todayDate").textContent =
        new Date().toLocaleDateString("ar-EG", {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric"
        });
}

// إظهار حقول الشغل أو إخفاؤها في الإجازة
function updateDayType() {
    const isHoliday = dayType.value === "holiday";

    workFields.hidden = isHoliday;

    hoursInput.required = !isHoliday;
    moneyInput.required = !isHoliday;
    banzenInput.required = !isHoliday;
}

dayType.addEventListener("change", updateDayType);

// تصنيف اليوم
function getStatus(record) {
    if (record.type === "holiday") {
        return {
            text: "إجازة 🏖️",
            className: "holiday"
        };
    }

    if (record.money > record.target) {
        return {
            text: "يوم ناجح جدًا 🏆",
            className: "success"
        };
    }

    if (record.money === record.target) {
        return {
            text: "يوم ناجح 🎯",
            className: "exact"
        };
    }

    return {
        text: "يوم سيئ 📉",
        className: "fail"
    };
}

// إغلاق رسالة التشجيع
function hideCelebration() {
    if (celebrationOverlay.hidden) return;

    clearTimeout(celebrationTimer);
    clearTimeout(celebrationClosingTimer);

    celebrationOverlay.classList.add("closing");

    celebrationClosingTimer = setTimeout(() => {
        celebrationOverlay.hidden = true;
        celebrationOverlay.classList.remove("closing");
    }, 300);
}

// عرض رسالة التشجيع المتحركة
function showCelebration(record) {
    clearTimeout(celebrationTimer);
    clearTimeout(celebrationClosingTimer);

    celebrationOverlay.hidden = true;
    celebrationOverlay.classList.remove("closing");

    if (record.type === "holiday") {
        celebrationEmoji.textContent = "🏖️";
        celebrationTitle.textContent = "إجازة مستحقة يا بطل!";
        celebrationText.textContent =
            "خد وقتك في الراحة، واستعد ليوم جديد 💚";

    } else if (record.money > record.target) {
        const difference = record.money - record.target;

        celebrationEmoji.textContent = "🏆";
        celebrationTitle.textContent = "يوم ناجح جدًا يا بطل! 🔥";
        celebrationText.textContent =
            `عديت هدفك بـ ${moneyFormat(difference)}. كمل بنفس القوة!`;

    } else if (record.money === record.target) {
        celebrationEmoji.textContent = "🎯";
        celebrationTitle.textContent = "يوم ناجح يا بطل!";
        celebrationText.textContent =
            "حققت هدفك بالظبط. الاستمرار هو سر النجاح 💚";

    } else {
        const difference = record.target - record.money;

        celebrationEmoji.textContent = "💪";
        celebrationTitle.textContent = "بكرة أحسن يا بطل!";
        celebrationText.textContent =
            `ناقصك ${moneyFormat(difference)} عن هدفك النهارده. اتعلم من يومك وكمّل!`;
    }

    celebrationOverlay.hidden = false;

    celebrationTimer = setTimeout(() => {
        hideCelebration();
    }, 3200);
}

celebrationClose.addEventListener("click", hideCelebration);

// إغلاق الرسالة عند الضغط على الخلفية
celebrationOverlay.addEventListener("click", function (event) {
    if (event.target === celebrationOverlay) {
        hideCelebration();
    }
});

// مقارنة الإيراد بالهدف وعرض تفاصيل اليوم
function renderComparison(record) {
    if (!record || record.type !== "work") {
        dailyComparison.hidden = true;
        return;
    }

    const difference = record.money - record.target;

    document.getElementById("resultHours").textContent =
        `${record.hours} ساعة`;

    document.getElementById("resultTarget").textContent =
        moneyFormat(record.target);

    document.getElementById("resultMoney").textContent =
        moneyFormat(record.money);

    document.getElementById("resultBanzen").textContent =
        moneyFormat(record.banzen);

    document.getElementById("resultNet").textContent =
        moneyFormat(record.net);

    const comparisonLabel =
        document.getElementById("comparisonLabel");

    const resultDifference =
        document.getElementById("resultDifference");

    const dailyMessage =
        document.getElementById("dailyMessage");

    dailyComparison.hidden = false;

    dailyMessage.replaceChildren();

    if (difference > 0) {
        comparisonLabel.textContent = "زيادة عن الهدف";
        resultDifference.textContent = moneyFormat(difference);

        dailyMessage.className = "message success";

        const heading = document.createElement("h3");
        heading.textContent = "🏆 يوم ناجح جدًا يا بطل!";

        const paragraph1 = document.createElement("p");
        paragraph1.textContent =
            `حققت زيادة ${moneyFormat(difference)} عن هدفك.`;

        const paragraph2 = document.createElement("p");
        paragraph2.textContent =
            `صافي مكسبك بعد البنزين: ${moneyFormat(record.net)}`;

        dailyMessage.append(heading, paragraph1, paragraph2);

    } else if (difference === 0) {
        comparisonLabel.textContent = "الفرق عن الهدف";
        resultDifference.textContent = "0 ج";

        dailyMessage.className = "message exact";

        const heading = document.createElement("h3");
        heading.textContent = "🎯 حققت هدفك بالظبط!";

        const paragraph1 = document.createElement("p");
        paragraph1.textContent =
            "إيرادك وصل للهدف المطلوب تمامًا.";

        const paragraph2 = document.createElement("p");
        paragraph2.textContent =
            `صافي مكسبك بعد البنزين: ${moneyFormat(record.net)}`;

        dailyMessage.append(heading, paragraph1, paragraph2);

    } else {
        comparisonLabel.textContent = "ناقصك عن الهدف";
        resultDifference.textContent =
            moneyFormat(Math.abs(difference));

        dailyMessage.className = "message fail";

        const heading = document.createElement("h3");
        heading.textContent = "📉 لسه محتاج تحقق أكتر يا بطل";

        const paragraph1 = document.createElement("p");
        paragraph1.textContent =
            `ناقصك ${moneyFormat(Math.abs(difference))} عشان تحقق هدفك.`;

        const paragraph2 = document.createElement("p");
        paragraph2.textContent =
            `صافي مكسبك بعد البنزين: ${moneyFormat(record.net)}`;

        dailyMessage.append(heading, paragraph1, paragraph2);
    }
}

// تحديث الإحصائيات الشهرية والإجمالية
function renderStats() {
    const selectedMonth = monthFilter.value;

    const monthRecords = records.filter(record =>
        record.date.startsWith(selectedMonth)
    );

    const workRecords = monthRecords.filter(record =>
        record.type === "work"
    );

    const allWorkRecords = records.filter(record =>
        record.type === "work"
    );

    const monthNet = workRecords.reduce(
        (sum, record) => sum + record.net, 0
    );

    const allNet = allWorkRecords.reduce(
        (sum, record) => sum + record.net, 0
    );

    const successCount = workRecords.filter(record =>
        record.money > record.target
    ).length;

    const exactCount = workRecords.filter(record =>
        record.money === record.target
    ).length;

    const failCount = workRecords.filter(record =>
        record.money < record.target
    ).length;

    const holidayCount = monthRecords.filter(record =>
        record.type === "holiday"
    ).length;

    const totalSurplus = workRecords.reduce(
        (sum, record) =>
            sum + Math.max(0, record.money - record.target),
        0
    );

    const totalDeficit = workRecords.reduce(
        (sum, record) =>
            sum + Math.max(0, record.target - record.money),
        0
    );

    document.getElementById("monthNet").textContent =
        moneyFormat(monthNet);

    document.getElementById("allNet").textContent =
        moneyFormat(allNet);

    document.getElementById("successCount").textContent =
        successCount;

    document.getElementById("exactCount").textContent =
        exactCount;

    document.getElementById("failCount").textContent =
        failCount;

    document.getElementById("holidayCount").textContent =
        holidayCount;

    document.getElementById("totalSurplus").textContent =
        moneyFormat(totalSurplus);

    document.getElementById("totalDeficit").textContent =
        moneyFormat(totalDeficit);
}

// إنشاء خانة تفاصيل
function createDetail(label, value, extraClass = "") {
    const detail = document.createElement("div");
    detail.className = "detail";

    const title = document.createElement("span");
    title.textContent = label;

    const content = document.createElement("strong");
    content.textContent = value;

    if (extraClass) {
        content.className = extraClass;
    }

    detail.append(title, content);

    return detail;
}

// فتح أو إغلاق تفاصيل يوم من السجل
function toggleRecord(card, summaryButton) {
    const isOpen = card.classList.toggle("open");

    summaryButton.setAttribute("aria-expanded", String(isOpen));
}

// عرض سجل الأيام المختصر
function renderRecords() {
    recordsList.replaceChildren();

    const filteredRecords = records
        .filter(record =>
            showingAll ||
            record.date.startsWith(monthFilter.value)
        )
        .sort((a, b) => b.date.localeCompare(a.date));

    document.getElementById("recordsSummary").textContent =
        showingAll
            ? `إجمالي الأيام المسجلة: ${filteredRecords.length}`
            : `عدد السجلات في ${monthFilter.value}: ${filteredRecords.length}`;

    if (filteredRecords.length === 0) {
        const empty = document.createElement("div");
        empty.className = "empty-state";
        empty.textContent =
            "مفيش أيام مسجلة هنا لسه. ابدأ وسجل يومك 💚";

        recordsList.appendChild(empty);
        return;
    }

    filteredRecords.forEach(record => {
        const card = document.createElement("article");
        card.className = "record";

        // رأس اليوم الصغير القابل للضغط
        const summaryButton = document.createElement("button");
        summaryButton.type = "button";
        summaryButton.className = "record-summary";
        summaryButton.setAttribute("aria-expanded", "false");

        const summaryMain = document.createElement("span");
        summaryMain.className = "record-summary-main";

        const date = document.createElement("span");
        date.className = "record-date";
        date.textContent = `📅 ${formatDate(record.date)}`;

        const status = getStatus(record);

        const badge = document.createElement("span");
        badge.className = `status ${status.className}`;
        badge.textContent = status.text;

        summaryMain.append(date, badge);

        const chevron = document.createElement("span");
        chevron.className = "record-chevron";
        chevron.textContent = "▼";
        chevron.setAttribute("aria-hidden", "true");

        summaryButton.append(summaryMain, chevron);

        summaryButton.addEventListener("click", () => {
            toggleRecord(card, summaryButton);
        });

        // المحتوى التفصيلي المخفي
        const content = document.createElement("div");
        content.className = "record-content";

        const details = document.createElement("div");
        details.className = "record-details";

        if (record.type === "holiday") {
            details.append(
                createDetail("نوع اليوم", "إجازة"),
                createDetail("صافي المكسب", "0 ج")
            );
        } else {
            details.append(
                createDetail("ساعات الشغل", `${record.hours} ساعة`),
                createDetail("إجمالي الإيراد", moneyFormat(record.money)),
                createDetail("البنزين", moneyFormat(record.banzen)),
                createDetail("الهدف اليومي", moneyFormat(record.target)),
                createDetail(
                    "صافي المكسب",
                    moneyFormat(record.net),
                    record.net < 0
                        ? "record-net negative"
                        : "record-net"
                )
            );

            if (record.money > record.target) {
                details.append(
                    createDetail(
                        "الزيادة عن الهدف",
                        moneyFormat(record.money - record.target)
                    )
                );
            } else if (record.money < record.target) {
                details.append(
                    createDetail(
                        "العجز عن الهدف",
                        moneyFormat(record.target - record.money)
                    )
                );
            }
        }

        // أزرار التعديل والحذف داخل التفاصيل
        const actions = document.createElement("div");
        actions.className = "record-actions";

        const editButton = document.createElement("button");
        editButton.type = "button";
        editButton.className = "secondary";
        editButton.textContent = "✏️ تعديل";

        editButton.addEventListener("click", () => {
            editRecord(record.date);
        });

        const deleteButton = document.createElement("button");
        deleteButton.type = "button";
        deleteButton.className = "delete-record";
        deleteButton.textContent = "🗑️ حذف";

        deleteButton.addEventListener("click", () => {
            deleteRecord(record.date);
        });

        actions.append(editButton, deleteButton);
        content.append(details, actions);

        card.append(summaryButton, content);
        recordsList.appendChild(card);
    });
}

// تحديث الصفحة
function renderAll() {
    renderStats();
    renderRecords();
}

// حفظ يوم شغل أو إجازة
salaryForm.addEventListener("submit", function (event) {
    event.preventDefault();

    const date = workDate.value;
    const type = dayType.value;

    if (!date) {
        alert("اختار تاريخ اليوم الأول.");
        return;
    }

    let record;

    if (type === "holiday") {
        record = {
            date,
            type: "holiday",
            hours: 0,
            money: 0,
            banzen: 0,
            target: 0,
            net: 0
        };
    } else {
        const hours = Number(hoursInput.value);
        const money = Number(moneyInput.value);
        const banzen = Number(banzenInput.value);

        if (
            !Number.isFinite(hours) ||
            !Number.isFinite(money) ||
            !Number.isFinite(banzen) ||
            hours <= 0 ||
            money < 0 ||
            banzen < 0
        ) {
            alert(
                "راجع البيانات: ساعات الشغل أكبر من صفر، وباقي المبالغ لا تقل عن صفر."
            );
            return;
        }

        const target = hours * 100;
        const net = money - banzen;

        record = {
            date,
            type: "work",
            hours,
            money,
            banzen,
            target,
            net
        };
    }

    const existingIndex = records.findIndex(item =>
        item.date === date
    );

    if (
        existingIndex !== -1 &&
        date !== editingDate &&
        !confirm(
            "فيه سجل موجود للتاريخ ده. هل تريد استبداله بالبيانات الجديدة؟"
        )
    ) {
        return;
    }

    const oldRecords = records.map(item => ({ ...item }));

    if (existingIndex !== -1) {
        records[existingIndex] = record;
    } else {
        records.push(record);
    }

    if (!saveRecords()) {
        records = oldRecords;
        renderAll();
        return;
    }

    monthFilter.value = date.slice(0, 7);
    showingAll = false;

    resetForm();
    renderAll();

    // عرض تفاصيل اليوم المسجل
    renderComparison(record);

    // إظهار اليوم الجديد مفتوحًا في السجل
    const recordCards = recordsList.querySelectorAll(".record");

    recordCards.forEach(card => {
        const dateElement = card.querySelector(".record-date");

        if (dateElement && dateElement.textContent === `📅 ${formatDate(date)}`) {
            card.classList.add("open");

            const summaryButton = card.querySelector(".record-summary");
            summaryButton.setAttribute("aria-expanded", "true");
        }
    });

    // رسالة تشجيع متحركة بدل نافذة التنبيه التقليدية
    showCelebration(record);
});

// تعديل سجل موجود
function editRecord(date) {
    const record = records.find(item => item.date === date);

    if (!record) return;

    editingDate = date;

    workDate.value = record.date;
    dayType.value = record.type;

    hoursInput.value =
        record.type === "work" ? record.hours : "";

    moneyInput.value =
        record.type === "work" ? record.money : "";

    banzenInput.value =
        record.type === "work" ? record.banzen : "";

    updateDayType();

    saveButton.textContent = "حفظ التعديلات 💚";
    cancelEdit.hidden = false;

    renderComparison(record);

    salaryForm.scrollIntoView({
        behavior: "smooth",
        block: "start"
    });
}

// إعادة نموذج الإدخال لحالته الأصلية
function resetForm() {
    salaryForm.reset();

    editingDate = null;
    workDate.value = getLocalDate();

    saveButton.textContent = "احفظ بيانات اليوم 💚";
    cancelEdit.hidden = true;

    updateDayType();
}

// إلغاء التعديل
cancelEdit.addEventListener("click", function () {
    resetForm();
    dailyComparison.hidden = true;
});

// حذف يوم محدد
function deleteRecord(date) {
    const record = records.find(item => item.date === date);

    if (!record) return;

    if (
        !confirm(
            `هل أنت متأكد من حذف سجل ${formatDate(date)} نهائيًا؟`
        )
    ) {
        return;
    }

    const oldRecords = records;
    records = records.filter(item => item.date !== date);

    if (!saveRecords()) {
        records = oldRecords;
        return;
    }

    if (editingDate === date) {
        resetForm();
        dailyComparison.hidden = true;
    }

    renderAll();
}

// تصفير كل الأيام والمبالغ
document.getElementById("resetButton").addEventListener(
    "click",
    function () {
        if (records.length === 0) {
            alert("السجل فاضي بالفعل.");
            return;
        }

        const firstConfirm = confirm(
            "تحذير: هتمسح كل أيام الشغل والإجازات وكل الحسابات المحفوظة. هل أنت متأكد؟"
        );

        if (!firstConfirm) return;

        const secondConfirm = confirm(
            "تأكيد أخير: لا يمكن استرجاع البيانات بعد التصفير. هل تريد البدء من الصفر؟"
        );

        if (!secondConfirm) return;

        const oldRecords = records;
        records = [];

        if (!saveRecords()) {
            records = oldRecords;
            renderAll();
            return;
        }

        resetForm();
        dailyComparison.hidden = true;

        showingAll = false;
        monthFilter.value = getCurrentMonth();

        renderAll();

        alert("تم تصفير السجل. تقدر تبدأ مسيرة جديدة 💚");
    }
);

// تغيير الشهر المعروض
monthFilter.addEventListener("change", function () {
    showingAll = false;
    renderAll();
});

// عرض كل الأيام
document.getElementById("showAll").addEventListener(
    "click",
    function () {
        showingAll = true;
        renderAll();
    }
);

// تشغيل الموقع
updateToday();
loadRecords();

workDate.value = getLocalDate();
monthFilter.value = getCurrentMonth();

updateDayType();
renderAll();
