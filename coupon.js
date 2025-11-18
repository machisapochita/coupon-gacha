// coupon.js — 完全版（読み込みオーバーレイ堅牢化 + 店舗/クーポンキー検証 + 読み込み画像演出 + Thank You 表示）

const LOG_URL = (typeof window !== "undefined" && window.LOG_URL) ? window.LOG_URL : "https://script.google.com/macros/s/AKfycbwk02U0POEPJfGWzmyn2TqzIpyX10-0WyfTKITw6gB8ceJa9vT_U1-EnEzg5vOAVjoU/exec";

function prizeLabel(type) {
  switch (type) {
    case 'normal': return 'ノーマル賞';
    case 'rare': return 'レア賞';
    case 'last-one': return 'ラストワン賞';
    default: return '';
  }
}

/* ---------------------------
   外側エラーメッセージ（モーダル下に固定表示）
   --------------------------- */
let __outsideKeyErrorResizeHandler = null;
function showOutsideKeyError(message) {
  try {
    hideOutsideKeyError();
    const modal = document.getElementById("coupon-modal");
    const el = document.createElement("div");
    el.id = "outside-key-error";
    el.textContent = message;
    el.style.position = "fixed";
    el.style.color = "#e53935";
    el.style.background = "transparent";
    el.style.padding = "4px 6px";
    el.style.border = "none";
    el.style.zIndex = "2000";
    el.style.fontWeight = "600";
    el.style.whiteSpace = "nowrap";
    el.style.pointerEvents = "none";
    document.body.appendChild(el);

    function position() {
      const m = modal || document.getElementById("coupon-modal");
      const rect = m ? m.getBoundingClientRect() : { left: window.innerWidth / 2, width: 0, bottom: window.innerHeight * 0.75, top: window.innerHeight * 0.75 };
      const ew = el.offsetWidth;
      const eh = el.offsetHeight;
      let left = rect.left + (rect.width / 2) - (ew / 2);
      left = Math.max(8, Math.min(left, window.innerWidth - ew - 8));
      let top = rect.bottom + 8;
      if (top + eh + 8 > window.innerHeight) {
        top = rect.top - eh - 8;
        if (top < 8) {
          top = Math.max(8, window.innerHeight - eh - 8);
        }
      }
      el.style.left = `${left}px`;
      el.style.top = `${top}px`;
    }

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

/* ---------------------------
   読み込み／準備画像オーバーレイ表示（堅牢化）
   - 画像が無い場合はフォールバックのテキスト枠を表示
   - CSS が適用されていない状況にも対応するためインラインスタイルを設定
   --------------------------- */
function showCouponReadyImage() {
  try {
    let el = document.getElementById('coupon-ready-overlay');
    if (!el) {
      el = document.createElement('div');
      el.id = 'coupon-ready-overlay';
      // 重要：インラインスタイルで確実に中央表示されるようにする
      el.style.position = 'fixed';
      el.style.top = '50%';
      el.style.left = '50%';
      el.style.transform = 'translate(-50%, -50%)';
      el.style.zIndex = '950';
      el.style.pointerEvents = 'none';
      el.style.display = 'flex';
      el.style.alignItems = 'center';
      el.style.justifyContent = 'center';
      // 内部に img と fallback を作る
      const img = document.createElement('img');
      img.src = 'images/coupon-ready.png';
      img.alt = '準備完了';
      img.className = 'coupon-ready-img';
      // 見た目確保（インラインで幅指定。style.css と併用）
      img.style.width = '80vw';
      img.style.maxWidth = '1200px';
      img.style.height = 'auto';
      img.style.display = 'block';
      img.style.borderRadius = '8px';
      img.style.boxShadow = '0 8px 24px rgba(0,0,0,0.25)';
      // フォールバック要素（画像が壊れているときに表示）
      const fallback = document.createElement('div');
      fallback.id = 'coupon-ready-fallback';
      fallback.textContent = '準備完了';
      fallback.style.display = 'none';
      fallback.style.minWidth = '200px';
      fallback.style.minHeight = '80px';
      fallback.style.padding = '20px 24px';
      fallback.style.background = 'rgba(255,255,255,0.95)';
      fallback.style.color = '#333';
      fallback.style.borderRadius = '10px';
      fallback.style.fontSize = '1.6rem';
      fallback.style.fontWeight = '700';
      fallback.style.boxShadow = '0 8px 24px rgba(0,0,0,0.25)';
      fallback.style.textAlign = 'center';

      // 画像エラー時は img を隠して fallback を表示
      img.onerror = function() {
        img.style.display = 'none';
        fallback.style.display = 'block';
        console.warn('coupon-ready image failed to load:', img.src);
      };
      // 画像ロード成功時は確実に表示（念のため）
      img.onload = function() {
        fallback.style.display = 'none';
        img.style.display = 'block';
      };

      el.appendChild(img);
      el.appendChild(fallback);
      document.body.appendChild(el);
    }

    // remove hidden class if present
    el.classList.remove('hidden');
    // ensure visible in inline style
    el.style.display = 'flex';
  } catch (e) {
    console.warn('showCouponReadyImage failed', e);
  }
}
function hideCouponReadyImage() {
  try {
    const el = document.getElementById('coupon-ready-overlay');
    if (el) {
      // hide via inline style and class
      el.classList.add('hidden');
      el.style.display = 'none';
    }
  } catch (e) {
    // noop
  }
}

/* ---------------------------
   クーポン一覧レンダリング
   --------------------------- */
function renderCoupons() {
  const container = document.getElementById("coupon-container");
  if (!container) return;
  container.innerHTML = "";

  const userId = localStorage.getItem("userId");
  const coupons = JSON.parse(localStorage.getItem(`myCoupons_${userId}`) || "[]") || [];

  // 所持クーポンが 0 枚ならメッセージ表示して終了
  if (!Array.isArray(coupons) || coupons.length === 0) {
    container.innerHTML = '<div class="no-coupons">現在使用可能な<br>クーポンはありません</div>';
    // もし restaurants のレンダリング等と同期する必要があればここでイベントを発火しても良い
    return;
  }

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

  document.querySelectorAll(".use-button").forEach(button => {
    if (button.dataset.handlerAttached === "1") return;
    button.dataset.handlerAttached = "1";
    button.addEventListener("click", () => {
      hideOutsideKeyError();
      const storeId = button.dataset.id;
      const userId = localStorage.getItem("userId");
      const coupons = JSON.parse(localStorage.getItem(`myCoupons_${userId}`) || "[]") || [];
      const coupon = coupons.find(c => c.storeId === storeId);
      if (!coupon) {
        console.warn("use-button: coupon not found for storeId", storeId);
        return;
      }

      const restaurants = JSON.parse(localStorage.getItem(`restaurantData_${userId}`) || "[]") || [];
      const store = restaurants.find(r => r.storeId === storeId) || null;
      currentStore = store;

      // --- 互換: restaurants.js の prev/next ハンドラが参照できるようグローバル公開 ---
      try { window.currentStore = store; } catch (e) { /* noop */ }
      // 共有インデックスを初期化（restaurants.js の currentPhotoIndex を使うのでこちらは補助）
      window.__modalPhotoIndex = 0;

      const modal = document.getElementById("coupon-modal");
      if (!modal) {
        console.warn("use-button: coupon-modal not present");
        return;
      }

      modal.querySelector(".modal-store-name").textContent = coupon.storeName;
      modal.querySelector(".modal-discount").innerHTML = (prizeLabel(coupon.type) ? `${prizeLabel(coupon.type)}<br>` : "") + `${coupon.discount}円オフ`;
      modal.querySelector(".modal-conditions").innerHTML = (coupon.conditions || []).map(c => `<li>${c}</li>`).join("");
      modal.querySelector(".modal-expiry").textContent = `有効期限：${coupon.expiry}`;

      const keyInputEl = modal.querySelector("#key-input");
      if (keyInputEl) { try { keyInputEl.value = ""; keyInputEl.focus(); } catch (e) {} }

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

/* ---------------------------
   DOMContentLoaded: 初期同期 + Confirm ボタン登録 + 初回描画
   --------------------------- */
document.addEventListener("DOMContentLoaded", async () => {
  const loadingOverlay = document.getElementById("loading-overlay");
  if (loadingOverlay) loadingOverlay.classList.remove("hidden");

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
  } finally {
    if (loadingOverlay) loadingOverlay.classList.add("hidden");
  }

  // 確定ボタン登録
  try {
    const confirmBtn = document.querySelector(".confirm-use-button");
    if (confirmBtn) {
      if (confirmBtn.dataset.handlerAttached !== "1") {
        confirmBtn.dataset.handlerAttached = "1";
        confirmBtn.addEventListener("click", async () => {
          try {
            const userId = localStorage.getItem("userId") || "未設定";
            const couponModal = document.getElementById("coupon-modal");
            const modalStoreId = couponModal && couponModal.dataset && couponModal.dataset.storeId ? couponModal.dataset.storeId : null;
            let storeId = modalStoreId || (currentStore && (currentStore.storeId || currentStore.id)) || null;
            if (!storeId) {
              console.warn("confirm-use: no storeId found; aborting");
              if (couponModal) couponModal.classList.add("hidden");
              hideOutsideKeyError();
              return;
            }

            const coupons = JSON.parse(localStorage.getItem(`myCoupons_${userId}`) || "[]") || [];
            const restaurants = JSON.parse(localStorage.getItem(`restaurantData_${userId}`) || "[]") || [];
            const coupon = coupons.find(c => c && (c.storeId === storeId || c.id === storeId || (c.baseId && c.baseId === storeId.split("-")[0])));
            const store = restaurants.find(r => r && (r.storeId === storeId || r.id === storeId || (r.baseId && r.baseId === storeId.split("-")[0]))) || null;

            if (store) currentStore = store;

            const storeName = (coupon && coupon.storeName) ? coupon.storeName : (store && store.name) ? store.name : "未設定";
            const prizeType = (coupon && coupon.type) ? coupon.type : (store && store.prizeType) ? store.prizeType : "未設定";
            const salonId = (store && store.salonId) ? store.salonId : (localStorage.getItem("salonId") || "未設定");

            // --- キー検証（store.key or coupon.key を検証対象） ---
            const keyInput = couponModal ? couponModal.querySelector("#key-input") : null;
            let keyFeedback = couponModal ? couponModal.querySelector("#key-feedback") : null;
            const enteredKey = keyInput && keyInput.value ? String(keyInput.value).trim() : "";

            const expectedKey = (store && store.key) ? String(store.key).trim() : ((coupon && coupon.key) ? String(coupon.key).trim() : null);

            if (expectedKey) {
              if (enteredKey === "") {
                showOutsideKeyError("使用キーを入力してください");
                return;
              }
              if (expectedKey !== enteredKey) {
                showOutsideKeyError("使用キーが異なります");
                return;
              } else {
                hideOutsideKeyError();
              }
            } else {
              hideOutsideKeyError();
            }

            console.log("confirm-use: resolved ->", { userId, storeId, storeName, prizeType, salonId });

            // 読み込み演出を表示（Thank You 表示まで見せる）
            try { showCouponReadyImage(); } catch (e) { console.warn('showCouponReadyImage error', e); }

            // ローカル反映 → サーバ同期
            try {
              const markRes = await markCouponUsedAndSync(storeId);
              console.log("markCouponUsedAndSync result:", markRes);
            } catch (err) {
              console.warn("confirm-use: markCouponUsedAndSync failed:", err);
            }

            // 送信用 storeId は myCoupons に保存されたクーポンの storeId（variant）を優先して使う
            let logStoreId = storeId;
            try {
              const couponsList = JSON.parse(localStorage.getItem(`myCoupons_${userId}`) || "[]") || [];

              // 1) まずは modal に設定されていた storeId と一致するクーポンを探す
              let couponEntry = couponsList.find(c => c && (c.storeId === storeId || c.id === storeId));

              // 2) 見つからなければ baseId（storeId のプレフィックス）で探す
              if (!couponEntry) {
                const guessedBase = (storeId && typeof storeId === 'string' && storeId.indexOf('-') > -1)
                  ? storeId.split('-')[0]
                  : (store && store.baseId);
                if (guessedBase) {
                  couponEntry = couponsList.find(c => c && (c.baseId === guessedBase));
                }
              }

              // 3) それでも見つからなければ 店名＋賞種 で探す（稀なフォールバック）
              if (!couponEntry) {
                couponEntry = couponsList.find(c => c && c.storeName === storeName && c.type === prizeType);
              }

              if (couponEntry && couponEntry.storeId) {
                logStoreId = couponEntry.storeId;
              }
            } catch (e) {
              console.warn("resolve logStoreId failed, falling back to resolved storeId:", e);
            }

            try {
              const sendRes = await sendUsageLog({ userId, storeId: logStoreId, storeName, prizeType, salonId });
              console.log("sendUsageLog result:", sendRes);
            } catch (e) {
              console.warn("sendUsageLog failed after mark:", e);
            }

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

/* ---------------------------
   showThankYou: 読み込み画像を消して祝表示
   --------------------------- */
function showThankYou(callback) {
  try { hideCouponReadyImage(); } catch (e) {}
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

/* ---------------------------
   以降は既存のヘルパー群（openModal 等）...
   （ここから下は既存のファイルと同じ内容を維持） 
   --------------------------- */

/* 以下は既存コードを省略表示しませんが、上の行より下に
   あなたの既存ファイルの残り全体（openModal, playFullScreenVideo,
   postLog, sendUsageLog, markCouponUsedAndSync, requestSaveSnapshotSafe,
   bindModalClose 等）をそのまま残して下さい。 */


/* ---------------------------
   レストランモーダル / 写真ヘルパー
   --------------------------- */
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

/* ---------------------------
   ロギング / サーバ同期ヘルパー
   --------------------------- */
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

/* ---------------------------
   markCouponUsedAndSync
   --------------------------- */
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

/* ---------------------------
   requestSaveSnapshotSafe
   --------------------------- */
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

/* ---------------------------
   モーダル閉じボタンバインド
   --------------------------- */
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

// -----------------------------
// coupon モーダル専用: prev/next ハンドラ（coupon.js 内）
// 挿入場所: updatePhoto/openModal 定義の直後に置く
// -----------------------------
(function bindCouponPhotoNavHandlers(){
  const prevBtn = document.getElementById("prev-photo");
  const nextBtn = document.getElementById("next-photo");

  function _getImagesFromCurrentStore() {
    try {
      if (currentStore && currentStore.images && currentStore.images.length) return currentStore.images;
      // fallback: try window.currentStore (if restaurants.js 側でセットされている場合)
      if (window && window.currentStore && window.currentStore.images && window.currentStore.images.length) return window.currentStore.images;
    } catch (e) { /* noop */ }
    return null;
  }

  if (prevBtn) prevBtn.addEventListener("click", (e) => {
    try {
      const images = _getImagesFromCurrentStore();
      if (!images || images.length === 0) return;
      currentPhotoIndex = (currentPhotoIndex - 1 + images.length) % images.length;
      updatePhoto(images);
    } catch (err) { console.warn("coupon prev-photo error:", err); }
  });

  if (nextBtn) nextBtn.addEventListener("click", (e) => {
    try {
      const images = _getImagesFromCurrentStore();
      if (!images || images.length === 0) return;
      currentPhotoIndex = (currentPhotoIndex + 1) % images.length;
      updatePhoto(images);
    } catch (err) { console.warn("coupon next-photo error:", err); }
  });
})();