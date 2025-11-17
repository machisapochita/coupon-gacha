// coupon.js — 完全版（賞種ラベル + 店舗別使用キー検証 + showThankYou 表示 + 外側エラーメッセージ）

// ページ単位で上書き可能なロギング先
const LOG_URL = (typeof window !== "undefined" && window.LOG_URL) ? window.LOG_URL : "https://script.google.com/macros/s/AKfycbwk02U0POEPJfGWzmyn2TqzIpyX10-0WyfTKITw6gB8ceJa9vT_U1-EnEzg5vOAVjoU/exec";

function prizeLabel(type) {
  switch (type) {
    case 'normal': return 'ノーマル賞';
    case 'rare': return 'レア賞';
    case 'last-one': return 'ラストワン賞';
    default: return '';
  }
}

// --- Helper: 外側に表示するキーエラーメッセージ管理 ---
let __outsideKeyErrorResizeHandler = null;
function showOutsideKeyError(message) {
  try {
    hideOutsideKeyError(); // まず既存を消す
    const modal = document.getElementById("coupon-modal");
    const el = document.createElement("div");
    el.id = "outside-key-error";
    el.textContent = message;
    // 赤文字のみ、背景やボーダーは不要
    el.style.position = "fixed";
    el.style.color = "#e53935";
    el.style.background = "transparent";
    el.style.padding = "4px 0";
    el.style.border = "none";
    el.style.zIndex = "2000";
    el.style.fontWeight = "600";
    el.style.whiteSpace = "nowrap";
    el.style.pointerEvents = "none"; // クリックを妨げない
    document.body.appendChild(el);

    function position() {
      const m = modal || document.getElementById("coupon-modal");
      const rect = m ? m.getBoundingClientRect() : { left: window.innerWidth / 2, width: 0, bottom: window.innerHeight * 0.75, top: window.innerHeight * 0.75 };
      // 要素のサイズが確定してから位置を計算する
      const ew = el.offsetWidth;
      const eh = el.offsetHeight;

      // 左位置はモーダル中央に揃える（画面内に収める）
      let left = rect.left + (rect.width / 2) - (ew / 2);
      left = Math.max(8, Math.min(left, window.innerWidth - ew - 8));

      // まずモーダルの直下に表示、はみ出す場合はモーダルの上に配置
      let top = rect.bottom + 8; // 下側 8px マージン
      if (top + eh + 8 > window.innerHeight) {
        // 画面下にはみ出す -> 上側に表示
        top = rect.top - eh - 8;
        // それでも上にはみ出すなら画面下寄せにする
        if (top < 8) {
          top = Math.max(8, window.innerHeight - eh - 8);
        }
      }

      el.style.left = `${left}px`;
      el.style.top = `${top}px`;
    }

    // DOM 描画後に正確な寸法で配置
    requestAnimationFrame(() => {
      position();
      __outsideKeyErrorResizeHandler = () => position();
      window.addEventListener("resize", __outsideKeyErrorResizeHandler);
      window.addEventListener("scroll", __outsideKeyErrorResizeHandler, { passive: true });
    });
  } catch (e) {
    console.warn("showOutsideKeyError failed:", e);
  }
}
function hideOutsideKeyError() {
  try {
    const existing = document.getElementById("outside-key-error");
    if (existing) existing.remove();
    if (__outsideKeyErrorResizeHandler) {
      window.removeEventListener("resize", __outsideKeyErrorResizeHandler);
      window.removeEventListener("scroll", __outsideKeyErrorResizeHandler);
      __outsideKeyErrorResizeHandler = null;
    }
  } catch (e) {
    console.warn("hideOutsideKeyError failed:", e);
  }
}

// --- renderCoupons: クーポン一覧描画（使う・紹介ボタンのセット含む） ---
function renderCoupons() {
  const container = document.getElementById("coupon-container");
  if (!container) return;
  container.innerHTML = "";

  const userId = localStorage.getItem("userId");
  const coupons = JSON.parse(localStorage.getItem(`myCoupons_${userId}`) || "[]") || [];

  // 未使用を先に表示（used フラグが true のものは後へ）
  const sorted = coupons.slice().sort((a, b) => Number(!!a.used) - Number(!!b.used));

  sorted.forEach(coupon => {
    const card = document.createElement("div");
    card.className = `coupon-card ${coupon.type || ''}`;
    const label = prizeLabel(coupon.type);
    const discountHtml = (label ? `${label}<br>` : "") + `${coupon.discount}円オフ`;

    if (coupon.used) {
      card.classList.add("used", "collapsed");
      card.innerHTML = `
        <div class="collapsed-summary">
          <div class="sumi-mark"><img src="images/mark_sumi.png" alt="済マーク" /></div>
          <div class="summary-text">
            <h3 class="store-name">${coupon.storeName}</h3>
            <p class="discount-amount">${discountHtml}</p>
          </div>
        </div>

        <div class="collapsed-details" style="display: none;">
          <ul class="coupon-conditions">
            ${(coupon.conditions || []).map(c => `<li>${c}</li>`).join("")}
          </ul>
          <p class="coupon-expiry">有効期限：${coupon.expiry}</p>
          <div class="coupon-actions">
            <button class="intro-button" data-id="${coupon.storeId}">紹介</button>
          </div>
        </div>

        <div class="expand-indicator">▼</div>
      `;

      card.addEventListener("click", () => {
        const details = card.querySelector(".collapsed-details");
        const indicator = card.querySelector(".expand-indicator");
        const isVisible = details.style.display === "block";
        details.style.display = isVisible ? "none" : "block";
        card.classList.toggle("expanded", !isVisible);
        indicator.textContent = isVisible ? "▼" : "▲";
      });

      const introButton = card.querySelector(".intro-button");
      if (introButton) {
        introButton.addEventListener("click", (e) => {
          e.stopPropagation();
          const storeId = introButton.dataset.id;
          const restaurantData = JSON.parse(localStorage.getItem(`restaurantData_${userId}`) || "[]");
          const store = restaurantData.find(s => s.storeId === storeId);
          if (!store) { alert("店舗情報が見つかりませんでした"); return; }
          store.unlocked = true;
          openModal(store);
        });
      }
    } else {
      card.innerHTML = `
        <div class="coupon-header">
          <h3 class="store-name">${coupon.storeName}</h3>
          <p class="discount-amount">${discountHtml}</p>
        </div>
        <ul class="coupon-conditions">
          ${(coupon.conditions || []).map(c => `<li>${c}</li>`).join("")}
        </ul>
        <p class="coupon-expiry">有効期限：${coupon.expiry}</p>
        <div class="coupon-actions">
          <button class="use-button" data-id="${coupon.storeId}">使う</button>
          <button class="intro-button" data-id="${coupon.storeId}">紹介</button>
        </div>
      `;
      const introButton = card.querySelector(".intro-button");
      if (introButton) {
        introButton.addEventListener("click", () => {
          const storeId = introButton.dataset.id;
          const restaurantData = JSON.parse(localStorage.getItem(`restaurantData_${userId}`) || "[]");
          const store = restaurantData.find(s => s.storeId === storeId);
          if (!store) { alert("店舗情報が見つかりませんでした"); return; }
          openModal(store);
        });
      }
    }

    container.appendChild(card);
  });

  // 「使う」ボタンのイベント登録（重複登録は防ぐ）
  document.querySelectorAll(".use-button").forEach(button => {
    if (button.dataset.handlerAttached === "1") return;
    button.dataset.handlerAttached = "1";
    button.addEventListener("click", () => {
      hideOutsideKeyError(); // モーダルを開く前に外側エラーを消す
      const storeId = button.dataset.id;
      const userId = localStorage.getItem("userId");
      const coupons = JSON.parse(localStorage.getItem(`myCoupons_${userId}`) || "[]") || [];
      const coupon = coupons.find(c => c.storeId === storeId);
      if (!coupon) {
        console.warn("use-button: coupon not found for storeId", storeId);
        return;
      }

      // restaurants から store を探して currentStore にセット
      const restaurants = JSON.parse(localStorage.getItem(`restaurantData_${userId}`) || "[]") || [];
      const store = restaurants.find(r => r.storeId === storeId) || null;
      currentStore = store;

      const modal = document.getElementById("coupon-modal");
      if (!modal) {
        console.warn("use-button: coupon-modal not present");
        return;
      }

      modal.querySelector(".modal-store-name").textContent = coupon.storeName;
      modal.querySelector(".modal-discount").innerHTML = (prizeLabel(coupon.type) ? `${prizeLabel(coupon.type)}<br>` : "") + `${coupon.discount}円オフ`;
      modal.querySelector(".modal-conditions").innerHTML = (coupon.conditions || []).map(c => `<li>${c}</li>`).join("");
      modal.querySelector(".modal-expiry").textContent = `有効期限：${coupon.expiry}`;

      // key input 初期化 + フォーカス（存在すれば）
      const keyInputEl = modal.querySelector("#key-input");
      if (keyInputEl) { try { keyInputEl.value = ""; keyInputEl.focus(); } catch (e) {} }

      // モーダル内の補助フィードバック要素（保留表示はしない設計だが要素は確保）
      let keyFeedback = modal.querySelector("#key-feedback");
      if (!keyFeedback) {
        keyFeedback = document.createElement("div");
        keyFeedback.id = "key-feedback";
        keyFeedback.style.marginTop = "8px";
        keyFeedback.style.fontWeight = "bold";
        const actions = modal.querySelector(".coupon-actions");
        if (actions && actions.parentNode) actions.parentNode.insertBefore(keyFeedback, actions.nextSibling);
        else modal.appendChild(keyFeedback);
      }
      keyFeedback.textContent = ""; keyFeedback.className = "";

      modal.dataset.storeId = storeId;
      modal.classList.remove("hidden");
    });
  });

  const loadingOverlay = document.getElementById("loading-overlay");
  if (loadingOverlay) loadingOverlay.classList.add("hidden");
}

// DOMContentLoaded: サーバ state 読込（あれば） + 確定ボタン登録 + 初回描画
document.addEventListener("DOMContentLoaded", async () => {
  try {
    const userId = localStorage.getItem("userId");
    if (userId) {
      try {
        const url = LOG_URL + "?action=getState&userId=" + encodeURIComponent(userId);
        const respText = await fetch(url, { method: "GET" }).then(r => r.text());
        let resp;
        try { resp = JSON.parse(respText); } catch (e) { resp = { status: "parse-error", raw: respText }; }
        if (resp && resp.status === "OK" && resp.found && resp.state) {
          if (resp.state.coupons) localStorage.setItem(`myCoupons_${userId}`, JSON.stringify(resp.state.coupons));
          if (resp.state.restaurantData) localStorage.setItem(`restaurantData_${userId}`, JSON.stringify(resp.state.restaurantData));
          if (resp.state.gachaState) localStorage.setItem(`gachaState_${userId}`, JSON.stringify(resp.state.gachaState));
          console.log("coupon.js: applied server state for user", userId);
        } else {
          console.info("coupon.js: no server state or not found", resp);
        }
      } catch (e) {
        console.warn("coupon.js: failed to load/apply server state:", e);
      }
    }
  } catch (e) {
    console.warn("coupon.js: DOMContentLoaded pre-sync error:", e);
  }

  // 確定ボタン（クーポン使用確定）の登録（堅牢に）
  try {
    const confirmBtn = document.querySelector(".confirm-use-button");
    if (confirmBtn) {
      if (confirmBtn.dataset.handlerAttached === "1") {
        // 既に登録済み
      } else {
        confirmBtn.dataset.handlerAttached = "1";
        confirmBtn.addEventListener("click", async () => {
          try {
            const userId = localStorage.getItem("userId") || "未設定";
            const couponModal = document.getElementById("coupon-modal");
            const modalStoreId = couponModal && couponModal.dataset && couponModal.dataset.storeId ? couponModal.dataset.storeId : null;

            // 優先: modal.dataset.storeId -> currentStore -> abort
            let storeId = modalStoreId || (currentStore && (currentStore.storeId || currentStore.id)) || null;
            if (!storeId) {
              console.warn("confirm-use: no storeId found; aborting");
              if (couponModal) couponModal.classList.add("hidden");
              hideOutsideKeyError();
              return;
            }

            // 最新のローカル状態を参照
            const coupons = JSON.parse(localStorage.getItem(`myCoupons_${userId}`) || "[]") || [];
            const restaurants = JSON.parse(localStorage.getItem(`restaurantData_${userId}`) || "[]") || [];
            const coupon = coupons.find(c => c && (c.storeId === storeId || c.id === storeId || (c.baseId && c.baseId === storeId.split("-")[0])));
            const store = restaurants.find(r => r && (r.storeId === storeId || r.id === storeId || (r.baseId && r.baseId === storeId.split("-")[0]))) || null;

            // 保険: currentStore を更新
            if (store) currentStore = store;

            const storeName = (coupon && coupon.storeName) ? coupon.storeName : (store && store.name) ? store.name : "未設定";
            const prizeType = (coupon && coupon.type) ? coupon.type : (store && store.prizeType) ? store.prizeType : "未設定";
            const salonId = (store && store.salonId) ? store.salonId : (localStorage.getItem("salonId") || "未設定");

            // --- キー検証ロジック ---
            const keyInput = couponModal ? couponModal.querySelector("#key-input") : null;
            // modal 内の補助要素（成功メッセージは出さない）
            let keyFeedback = couponModal ? couponModal.querySelector("#key-feedback") : null;
            const enteredKey = keyInput && keyInput.value ? String(keyInput.value).trim() : "";

            // store.key が存在する場合は照合を必須にする
            if (store && store.key) {
              if (enteredKey === "") {
                // 空入力は外側に表示
                showOutsideKeyError("使用キーを入力してください");
                return; // 入力を促して中断
              }
              if (String(store.key) !== enteredKey) {
                // 不一致は外側に表示（モーダル外）
                showOutsideKeyError("使用キーが異なります");
                return; // キー不一致 → 中断
              } else {
                // 一致したら外側エラーは消して、そのまま成功フローへ（モーダル内の「ありがとうございます」は不要）
                hideOutsideKeyError();
              }
            } else {
              // キー未設定の店舗はそのまま通す
              hideOutsideKeyError();
            }

            console.log("confirm-use: resolved ->", { userId, storeId, storeName, prizeType, salonId });

            // 表示：読み込み中の準備画像を出す（Thank You 表示が出るまで見せる）
            try { showCouponReadyImage(); } catch (e) { console.warn('showCouponReadyImage error', e); }

            // mark -> send usage log (先にローカル反映)
            try {
              const markRes = await markCouponUsedAndSync(storeId);
              console.log("markCouponUsedAndSync result:", markRes);
            } catch (err) {
              console.warn("confirm-use: markCouponUsedAndSync failed:", err);
            }

            try {
              const sendRes = await sendUsageLog({ userId, storeId, storeName, prizeType, salonId });
              console.log("sendUsageLog result:", sendRes);
            } catch (e) {
              console.warn("sendUsageLog failed after mark:", e);
            }

            // 成功時は即座に Thanks を表示（モーダルは閉じる）
            try {
              const m = couponModal || document.getElementById("coupon-modal");
              if (m) m.classList.add("hidden");
            } catch (e) {}

            try {
              showThankYou(() => {
                try { renderCoupons(); } catch (e) { console.warn("renderCoupons after thankyou failed:", e); }
                try { if (typeof window.renderRestaurants === "function") window.renderRestaurants(); } catch (e) {}
              });
            } catch (e) {
              // fallback
              try { renderCoupons(); } catch (err) { console.warn("renderCoupons fallback failed:", err); }
            }
          } catch (err) {
            console.error("confirm-use handler unexpected error:", err);
          }
        });
      }
    } else {
      console.warn("confirm-use-button not found");
    }
  } catch (e) {
    console.warn("confirm button registration failed:", e);
  }

  // 初回描画
  try { renderCoupons(); } catch (e) { console.warn("initial renderCoupons failed:", e); }
});

function showCouponReadyImage() {
  try {
    // 既存要素があれば再利用、なければ body に作る（HTML に既に置いた場合は既存要素を使う）
    let el = document.getElementById('coupon-ready-overlay');
    if (!el) {
      el = document.createElement('div');
      el.id = 'coupon-ready-overlay';
      el.className = 'coupon-ready-overlay';
      el.style.pointerEvents = 'none';
      const img = document.createElement('img');
      img.src = 'images/coupon-ready.png';
      img.alt = '準備中';
      img.className = 'coupon-ready-img';
      el.appendChild(img);
      document.body.appendChild(el);
    }
    el.classList.remove('hidden');
  } catch (e) {
    console.warn('showCouponReadyImage failed', e);
  }
}

function hideCouponReadyImage() {
  try {
    const el = document.getElementById('coupon-ready-overlay');
    if (el) el.classList.add('hidden');
  } catch (e) {
    // noop
  }
}

// ---- showThankYou: 使用完了時のアニメ風表示 ----
function showThankYou(callback) {
  // Thank You 表示直前に読み込み画像を消す（ユーザが見ているのは読み込み画像 → 祝表示へ遷移）
  try { hideCouponReadyImage(); } catch (e) { /* noop */ }

  const thankYou = document.createElement("div");
  thankYou.textContent = "🎉 Thank You!";
  thankYou.style.position = "fixed";
  thankYou.style.top = "50%";
  thankYou.style.left = "50%";
  thankYou.style.transform = "translate(-50%, -50%)";
  thankYou.style.fontSize = "2rem";
  thankYou.style.background = "#ff6f61";
  thankYou.style.color = "white";
  thankYou.style.padding = "20px 40px";
  thankYou.style.borderRadius = "12px";
  thankYou.style.zIndex = "1000";
  thankYou.style.boxShadow = "0 0 10px rgba(0,0,0,0.3)";
  thankYou.style.transition = "opacity 300ms ease, transform 300ms ease";
  thankYou.style.opacity = "0";
  document.body.appendChild(thankYou);

  requestAnimationFrame(() => {
    thankYou.style.opacity = "1";
    thankYou.style.transform = "translate(-50%, -54%) scale(1.02)";
  });

  setTimeout(() => {
    thankYou.style.opacity = "0";
    thankYou.style.transform = "translate(-50%, -46%) scale(0.98)";
    setTimeout(() => {
      try { thankYou.remove(); } catch (e) {}
      if (typeof callback === "function") callback();
    }, 320);
  }, 1400);
}

// --- openModal / photo helpers ---
let currentPhotoIndex = 0;
let currentStore = null;

function updatePhoto(images) {
  const photo = document.getElementById("modal-photo");
  if (!photo) return;
  if (!images || images.length === 0) {
    photo.src = "images/secret_image.png";
    return;
  }
  photo.src = images[currentPhotoIndex] || images[0];
}

function openModal(store) {
  if (!store) return;
  if (!store.unlocked) {
    alert("この店舗はまだアンロックされていません！");
    return;
  }
  currentStore = store;

  const modal = document.getElementById("restaurant-modal");
  if (!modal) {
    if (store.videoUrl) playFullScreenVideo(store.videoUrl);
    return;
  }

  modal.querySelector(".modal-store-name").textContent = store.name || "店舗名";
  const photoEl = modal.querySelector("#modal-photo");
  if (photoEl) photoEl.src = (store.images && store.images[0]) ? store.images[0] : "images/secret_image.png";
  const townEl = modal.querySelector(".modal-town");
  if (townEl) townEl.textContent = `📍 所在地：${store.town || "未設定"}`;
  const hoursEl = modal.querySelector(".modal-hours");
  if (hoursEl) hoursEl.textContent = `🕒 営業時間：${store.hours || "未設定"}`;
  const mapButton = modal.querySelector(".map-button");
  if (mapButton) mapButton.href = store.mapUrl || "#";
  const videoButton = modal.querySelector(".video-button");
  if (videoButton) {
    videoButton.onclick = (e) => { e.preventDefault(); if (store.videoUrl) playFullScreenVideo(store.videoUrl); };
  }
  const hpButton = modal.querySelector(".hp-button");
  const hpBadge = modal.querySelector(".hp-badge");
  if (hpButton) {
    if (store.hpUrl) { hpButton.href = store.hpUrl; hpButton.style.display = "inline-block"; hpBadge && (hpBadge.style.display = "none"); }
    else { hpButton.href = "#"; hpButton.style.display = "none"; hpBadge && (hpBadge.style.display = "inline-block"); }
  }

  currentPhotoIndex = 0;
  updatePhoto(store.images);
  modal.classList.remove("hidden");
}

function playFullScreenVideo(url) {
  if (!url) { alert("動画URLが登録されていません"); return; }
  const existing = document.querySelector(".fullscreen-video");
  if (existing) existing.remove();
  const container = document.createElement("div");
  container.className = "fullscreen-video";
  container.innerHTML = `<video src="${url}" controls autoplay style="width:100%;height:100%;object-fit:contain;"></video><button class="close-video-button">×</button>`;
  document.body.appendChild(container);
  const v = container.querySelector("video");
  const btn = container.querySelector(".close-video-button");
  btn.addEventListener("click", () => { try { v.pause(); } catch(e){} container.remove(); });
  v.addEventListener("ended", () => container.remove());
}

// --- logging helpers (Apps Script expects form-urlencoded 'data=') ---
function postLog(payload) {
  if (!LOG_URL) {
    console.warn("postLog: LOG_URL not configured — skipping", payload);
    return Promise.resolve({ skipped: true });
  }
  if (payload && payload.eventType === "viewed" && payload.eventSource && payload.eventSource !== "gacha") {
    console.log("postLog: skipping viewed (not gacha):", payload.eventSource);
    return Promise.resolve({ skipped: true });
  }
  return fetch(LOG_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8" },
    body: "data=" + encodeURIComponent(JSON.stringify(payload))
  }).then(async r => {
    const text = await r.text().catch(() => "");
    try { return JSON.parse(text); } catch (e) { return { raw: text, status: r.status }; }
  });
}

function sendUsageLog({ userId, storeId, storeName, prizeType, salonId }) {
  const payload = { timestamp: new Date().toISOString(), userId, storeId, storeName, prizeType, salonId, eventType: "used", gachaCompleted: localStorage.getItem("gachaCompleted") === "true" };
  try {
    const key = 'lastSentLog';
    const last = JSON.parse(sessionStorage.getItem(key) || "{}");
    const payloadSig = JSON.stringify({ userId, storeId, salonId, eventType: "used" });
    const now = Date.now();
    if (last.sig === payloadSig && (now - (last.t || 0)) < 2000) {
      console.warn("sendUsageLog: duplicate suppressed", payloadSig);
      return Promise.resolve({ skipped: true });
    }
    sessionStorage.setItem(key, JSON.stringify({ sig: payloadSig, t: now }));
  } catch (e) {
    console.warn("sendUsageLog: dedupe check failed", e);
  }

  console.log("sendUsageLog: payload ->", payload);
  return postLog(payload).then(res => { console.log("sendUsageLog ok:", res); return res; }).catch(err => { console.error("sendUsageLog error:", err); throw err; });
}

// --- markCouponUsedAndSync: ローカル反映 → render → サーバ同期（安全ラッパーで） ---
function markCouponUsedAndSync(couponIdentifier) {
  try {
    const userId = localStorage.getItem("userId");
    if (!userId) return Promise.resolve({ skipped: true });

    const couponsKey = `myCoupons_${userId}`;
    const restaurantsKey = `restaurantData_${userId}`;

    const coupons = JSON.parse(localStorage.getItem(couponsKey) || "[]");
    const restaurants = JSON.parse(localStorage.getItem(restaurantsKey) || "[]");

    let found = false;
    let matchedIds = [];

    for (let i = 0; i < coupons.length; i++) {
      const c = coupons[i];
      const cIds = [c.storeId, c.id, c.baseId].filter(Boolean);
      if (cIds.includes(couponIdentifier) || c.id === couponIdentifier || c.storeId === couponIdentifier) {
        if (!c.used) {
          c.used = true;
          c.usedAt = new Date().toISOString();
          coupons[i] = c;
          found = true;
        }
        matchedIds = cIds.slice();
        break;
      }
    }

    if (matchedIds.length > 0) {
      for (let j = 0; j < restaurants.length; j++) {
        const s = restaurants[j];
        const sIds = [s.storeId, s.id, s.baseId].filter(Boolean);
        const intersects = sIds.some(x => matchedIds.includes(x));
        if (intersects) {
          s.couponUsed = true;
          restaurants[j] = s;
        }
      }
    }

    localStorage.setItem(couponsKey, JSON.stringify(coupons));
    localStorage.setItem(restaurantsKey, JSON.stringify(restaurants));
    try { renderCoupons(); } catch (e) { console.warn("renderCoupons after mark failed:", e); }
    try { if (typeof window.renderRestaurants === "function") window.renderRestaurants(); } catch (e) {}

    try { window.dispatchEvent(new Event('couponsChanged')); } catch (e) { console.warn('dispatch couponsChanged failed', e); }

    const snapshot = { coupons, restaurantData: restaurants, gachaState: JSON.parse(localStorage.getItem(`gachaState_${userId}`) || "{}") };
    return requestSaveSnapshotSafe(snapshot, true).then(res => ({ ok: true, applied: found, savedOrQueued: res })).catch(err => {
      console.warn("markCouponUsedAndSync: requestSaveSnapshotSafe failed:", err);
      return { ok: true, applied: found, error: String(err) };
    });
  } catch (err) {
    console.warn("markCouponUsedAndSync failed:", err);
    return Promise.reject(err);
  }
}

// ---- requestSaveSnapshotSafe: セーフティラッパー（重複保存や適用中の衝突回避） ----
function requestSaveSnapshotSafe(snapshot, immediate) {
  window.__applyingServerState = window.__applyingServerState || false;
  window.__lastSavedSnapshotJson = window.__lastSavedSnapshotJson || null;

  if (window.__applyingServerState) {
    console.log('requestSaveSnapshotSafe: skipping save because applyingServerState is true');
    return Promise.resolve({ skipped: true, reason: 'applyingServerState' });
  }

  let snapshotJson = null;
  try {
    snapshotJson = JSON.stringify(snapshot);
    if (window.__lastSavedSnapshotJson === snapshotJson) {
      return Promise.resolve({ skipped: true, reason: 'no-change' });
    }
  } catch (e) {
    console.warn('requestSaveSnapshotSafe: stringify failed, proceeding', e);
  }

  const doSave = () => {
    if (window.stateSync && typeof window.stateSync.requestSave === 'function') {
      try {
        if (immediate && typeof window.stateSync.flushNow === 'function') {
          return window.stateSync.flushNow();
        }
        window.stateSync.requestSave(snapshot);
        return Promise.resolve({ queued: true });
      } catch (e) {
        console.warn('stateSync.requestSave failed, falling back', e);
      }
    }

    if (typeof saveGachaStateToServer === 'function') {
      try {
        return Promise.resolve(saveGachaStateToServer(snapshot, { immediate: !!immediate }));
      } catch (e) {
        console.warn('saveGachaStateToServer failed, falling back', e);
      }
    }

    try {
      const url = (typeof LOG_URL !== "undefined") ? LOG_URL : (window.LOG_URL || "");
      const userId = localStorage.getItem("userId");
      if (!userId) return Promise.resolve({ skipped: true, reason: 'no-user' });
      const payload = { eventType: "saveState", userId: userId, state: snapshot || {} };
      return fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8" },
        body: "data=" + encodeURIComponent(JSON.stringify(payload))
      }).then(r => r.text()).then(t => { try { return JSON.parse(t); } catch (e) { return { raw: t }; } });
    } catch (e) {
      return Promise.reject(e);
    }
  };

  return doSave().then(res => {
    try { if (snapshotJson) window.__lastSavedSnapshotJson = snapshotJson; } catch (e) {}
    return res;
  }).catch(err => {
    console.warn('requestSaveSnapshotSafe: save failed', err);
    throw err;
  });
}
window.requestSaveSnapshotSafe = requestSaveSnapshotSafe;

// モーダルの閉じボタンバインド（存在すれば）
(function bindModalClose() {
  const close = document.querySelector(".close-button");
  if (close) close.addEventListener("click", () => {
    const modal = document.getElementById("restaurant-modal");
    if (modal) modal.classList.add("hidden");
    hideOutsideKeyError();
  });
})();

(function bindCouponModalClose() {
  const close = document.querySelector("#coupon-modal .close-button");
  if (close) close.addEventListener("click", () => {
    const modal = document.getElementById("coupon-modal");
    if (modal) modal.classList.add("hidden");
    hideOutsideKeyError();
  });
})();