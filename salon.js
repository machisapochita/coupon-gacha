const salonData = generateDummySalons();
// 初回のみ localStorage に保存（上書き防止）
if (!localStorage.getItem("salonData")) {
  localStorage.setItem("salonData", JSON.stringify(salonData));
}

function generateDummySalons() {
  return [
    {
      salonId: "salon001",
      name: "ヘアスタジオ雅",
      town: "知多市岡田町",
      hours: "9:00〜18:00",
      hpUrl: "https://hair-miyabi.example.com",
      images: ["images/salon01.jpg"]
    },
    {
      salonId: "salon002",
      name: "理容カットマン",
      town: "知多市新舞子",
      hours: "8:30〜19:00",
      hpUrl: "",
      images: ["images/salon02.jpg"]
    },
    {
      salonId: "salon003",
      name: "美容室ルーチェ",
      town: "知多市八幡町",
      hours: "10:00〜20:00",
      hpUrl: "https://luce-hair.example.com",
      images: ["images/salon03.jpg"]
    },
    {
      salonId: "salon004",
      name: "ヘアサロン風",
      town: "知多市旭町",
      hours: "9:30〜18:30",
      hpUrl: "",
      images: ["images/salon04.jpg"]
    },
    {
      salonId: "salon005",
      name: "理容スタイル",
      town: "知多市寺本台",
      hours: "8:00〜17:00",
      hpUrl: "https://style-barber.example.com",
      images: ["images/salon05.jpg"]
    },
    {
      salonId: "salon006",
      name: "美容室アミ",
      town: "知多市南巽が丘",
      hours: "10:00〜19:00",
      hpUrl: "",
      images: ["images/salon06.jpg"]
    },
    {
      salonId: "salon007",
      name: "ヘアデザイン結",
      town: "知多市つつじが丘",
      hours: "9:00〜18:00",
      hpUrl: "https://hair-yui.example.com",
      images: ["images/salon07.jpg"]
    },
    {
      salonId: "salon008",
      name: "理容サロン匠",
      town: "知多市岡田南町",
      hours: "8:30〜18:30",
      hpUrl: "",
      images: ["images/salon08.jpg"]
    },
    {
      salonId: "salon009",
      name: "美容室シエル",
      town: "知多市西巽が丘",
      hours: "10:00〜20:00",
      hpUrl: "https://ciel-hair.example.com",
      images: ["images/salon09.jpg"]
    },
    {
      salonId: "salon010",
      name: "ヘアサロン陽",
      town: "知多市清水が丘",
      hours: "9:00〜18:00",
      hpUrl: "",
      images: ["images/salon10.jpg"]
    }
  ];
}

function renderSalons() {
  const container = document.getElementById("salon-container");
  if (!container) {
    console.warn('salon-container が見つかりません。salons.html を確認してください。');
    return;
  }
  container.innerHTML = "";
  salonData.forEach(salon => {
    const card = document.createElement("div");
    card.className = "salon-store-card";
    card.innerHTML = `
      <img src="${salon.images[0]}" alt="${salon.name}" class="store-photo" />
      <h3 class="store-salon-name">${salon.name}</h3>
      <p class="store-town">${salon.town}</p>
    `;
    // サロンID を dataset に保持しておく（安全な参照方法）
    card.dataset.salonId = salon.salonId;
    card.addEventListener("click", () => openModalById(salon.salonId));
    container.appendChild(card);
  });
}

// 複数候補のセレクタから最初に見つかった要素を返すヘルパー
function findModalChild(modal, selectors) {
  for (const sel of selectors) {
    const el = modal.querySelector(sel);
    if (el) return el;
  }
  return null;
}

function openModalById(salonId) {
  const salon = salonData.find(s => s.salonId === salonId);
  if (!salon) {
    console.warn(`salonId=${salonId} が salonData に見つかりません。`);
    return;
  }
  openModal(salon);
}

function openModal(salon) {
  const modal = document.getElementById("salon-modal");
  if (!modal) {
    console.warn('salon-modal element not found. Check salons.html contains the modal with id="salon-modal".');
    return;
  }

  // 複数の可能性に対応して要素を探す
  const nameEl = findModalChild(modal, [".modal-salon-name", ".modal-store-name", ".modal-title", "#modal-store-name", ".store-name", ".modal-header h2"]);
  const townEl = findModalChild(modal, [".modal-town", ".store-town", "#modal-town"]);
  const hoursEl = findModalChild(modal, [".modal-hours", ".store-hours", "#modal-hours"]);
  const photoEl = findModalChild(modal, ["#modal-salon-photo", ".modal-photo", ".store-photo-modal"]);
  const hpButton = findModalChild(modal, [".hp-button", "#modal-hp-button"]);
  const hpBadge = findModalChild(modal, [".hp-badge", "#modal-hp-badge"]);

  if (nameEl) nameEl.textContent = salon.name;
  if (townEl) townEl.textContent = `所在地：${salon.town}`;
  if (hoursEl) hoursEl.textContent = `営業時間：${salon.hours}`;

  if (photoEl) {
    photoEl.src = (salon.images && salon.images[0]) ? salon.images[0] : "images/salon01.jpg";
    photoEl.alt = salon.name;
  }

  if (hpButton && hpBadge) {
    if (salon.hpUrl) {
      hpButton.href = salon.hpUrl;
      hpButton.style.display = "inline-block";
      hpBadge.style.display = "none";
    } else {
      hpButton.style.display = "none";
      hpBadge.style.display = "inline-block";
    }
  }

  modal.classList.remove("hidden");
}

// DOM が準備できてからレンダリングとボタン登録を行う（安全対策）
document.addEventListener("DOMContentLoaded", () => {
  renderSalons();

  const modalRoot = document.getElementById("salon-modal");
  const closeBtn = (modalRoot && modalRoot.querySelector(".close-button")) || document.querySelector(".modal .close-button");
  if (closeBtn) {
    closeBtn.addEventListener("click", () => {
      const modal = document.getElementById("salon-modal");
      if (modal) modal.classList.add("hidden");
    });
  } else {
    console.warn('close button not found: "#salon-modal .close-button" or ".modal .close-button"');
  }
});