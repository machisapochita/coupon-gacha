const userId = localStorage.getItem("userId");
const restaurantData = JSON.parse(localStorage.getItem(`restaurantData_${userId}`)) || [];

function renderCoupons() {
  const container = document.getElementById("coupon-container");
  container.innerHTML = "";

  const userId = localStorage.getItem("userId");
  const coupons = JSON.parse(localStorage.getItem(`myCoupons_${userId}`)) || [];
  const sortedCoupons = coupons.sort((a, b) => a.used - b.used);

  sortedCoupons.forEach(coupon => {
    const card = document.createElement("div");
    card.className = `coupon-card ${coupon.type}`;
    if (coupon.used) {
      card.classList.add("used", "collapsed");

      card.innerHTML = `
        <div class="collapsed-summary">
          <div class="sumi-mark">
            <img src="images/mark_sumi.png" alt="済マーク" />
          </div>
          <div class="summary-text">
            <h3 class="store-name">${coupon.storeName}</h3>
            <p class="discount-amount">${coupon.discount}円オフ</p>
          </div>
        </div>

        <div class="collapsed-details" style="display: none;">
          <ul class="coupon-conditions">
            ${coupon.conditions.map(c => `<li>${c}</li>`).join("")}
          </ul>
          <p class="coupon-expiry">有効期限：${coupon.expiry}</p>
          <div class="coupon-actions">
            <button class="intro-button" data-id="${coupon.storeId}">紹介</button>
          </div>
        </div>

        <div class="expand-indicator">▼</div>
      `;

      // 展開・折りたたみ処理
      card.addEventListener("click", () => {
        const details = card.querySelector(".collapsed-details");
        const indicator = card.querySelector(".expand-indicator");
        const isVisible = details.style.display === "block";
        details.style.display = isVisible ? "none" : "block";
        card.classList.toggle("expanded", !isVisible);
        indicator.textContent = isVisible ? "▼" : "▲";
      });

      // 紹介ボタンのイベント登録
      const introButton = card.querySelector(".intro-button");
      if (introButton) {
        introButton.addEventListener("click", (e) => {
          e.stopPropagation(); // カードの展開イベントを防ぐ
          const storeId = introButton.dataset.id;
          const userId = localStorage.getItem("userId");
          const restaurantData = JSON.parse(localStorage.getItem(`restaurantData_${userId}`)) || [];
          const store = restaurantData.find(s => s.storeId === storeId);
          if (!store) {
            alert("店舗情報が見つかりませんでした");
            return;
          }
          store.unlocked = true; // クーポン所持者なので表示許可
          openModal(store);
        });
      }
    } else {
      card.innerHTML = `
        <div class="coupon-header">
          <h3 class="store-name">${coupon.storeName}</h3>
          <p class="discount-amount">${coupon.discount}円オフ</p>
        </div>
        <ul class="coupon-conditions">
          ${coupon.conditions.map(c => `<li>${c}</li>`).join("")}
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
          const userId = localStorage.getItem("userId");
          const restaurantData = JSON.parse(localStorage.getItem(`restaurantData_${userId}`)) || [];
          const store = restaurantData.find(s => s.storeId === storeId);
          if (!store) {
            alert("店舗情報が見つかりませんでした");
            return;
          }

          openModal(store); // ✅ モーダル表示
        });
      }
    }

    container.appendChild(card);
  });

  // ✅ 再描画後にイベントを再登録
  document.querySelectorAll(".use-button").forEach(button => {
    // 重複登録防止
    if (button.dataset.handlerAttached === "1") return;
    button.dataset.handlerAttached = "1";
    button.addEventListener("click", () => {
      const storeId = button.dataset.id;
      const userId = localStorage.getItem("userId");
      const coupons = JSON.parse(localStorage.getItem(`myCoupons_${userId}`)) || [];
      const coupon = coupons.find(c => c.storeId === storeId);
      if (!coupon) return;

      // restaurants データから店舗情報を探して currentStore にセット
      const restaurants = JSON.parse(localStorage.getItem(`restaurantData_${userId}`)) || [];
      const store = restaurants.find(r => r.storeId === storeId) || null;
      currentStore = store; // store が null でもセットしておく

      const modal = document.getElementById("coupon-modal");
      modal.querySelector(".modal-store-name").textContent = coupon.storeName;
      modal.querySelector(".modal-discount").textContent = `${coupon.discount}円オフ`;
      modal.querySelector(".modal-conditions").innerHTML = coupon.conditions.map(c => `<li>${c}</li>`).join("");
      modal.querySelector(".modal-expiry").textContent = `有効期限：${coupon.expiry}`;
      modal.querySelector("#key-input").value = "";
      modal.dataset.storeId = storeId;
      modal.classList.remove("hidden");
    });
  });
}

document.addEventListener("DOMContentLoaded", async () => {
  try {
    const userId = localStorage.getItem("userId");
    if (userId) {
      try {
        const url = LOG_URL + "?action=getState&userId=" + encodeURIComponent(userId);
        const resp = await fetch(url, { method: "GET" }).then(r => r.text()).then(t => { try { return JSON.parse(t); } catch(e) { return { status: "parse-error", raw: t }; }});
        if (resp && resp.status === "OK" && resp.found && resp.state) {
          // サーバ優先で localStorage に上書き
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

  // その後レンダリング
  renderCoupons();
});



function getSalonId(prizeType) {
  // prizeType と salon の紐付けがある場合はここでマップする
  const map = {
    "normal": "salon001",
    "rare": "salon002",
    "last-one": "salon003"
  };
  return map[prizeType] || localStorage.getItem("salonId") || "salon000";
}

function openModal(store) {
  if (!store.unlocked) {
    alert("この店舗はまだアンロックされていません！");
    return;
  }
  currentStore = store;

  // 追加：モーダル表示時に現在の店舗情報を保持する
  const modal = document.getElementById("restaurant-modal");
  if (!modal) return;
  modal.querySelector(".modal-store-name").textContent = store.name || "店舗名";
  modal.querySelector("#modal-photo").src = (store.images && store.images[0]) ? store.images[0] : "images/sample1.jpg";
  modal.querySelector(".modal-town").textContent = `📍 所在地：${store.town || "未設定"}`;
  modal.querySelector(".modal-hours").textContent = `🕒 営業時間：${store.hours || "未設定"}`;
  modal.querySelector(".map-button").href = store.mapUrl;
  modal.querySelector(".video-button").addEventListener("click", (e) => {
    e.preventDefault();
    playFullScreenVideo(store.videoUrl);
  });
  const hpButton = modal.querySelector(".hp-button");
  const hpBadge = modal.querySelector(".hp-badge");

  if (store.hpUrl) {
    hpButton.href = store.hpUrl;
    hpButton.style.display = "inline-block";
    hpButton.setAttribute("target", "_blank");
    hpBadge.style.display = "none";
  } else {
    hpButton.href = "#";
    hpButton.style.display = "none";
    hpBadge.style.display = "inline-block";
  }

  currentStore = store;
  currentPhotoIndex = 0;
  updatePhoto(store.images);

  modal.classList.remove("hidden");
}

// 送信先を一箇所で管理（ここに Apps Script の最新デプロイ URL を貼る）
const LOG_URL = "https://script.google.com/macros/s/AKfycbxTsZVOZfn5xoySkypMrYt_6pd0xtNcTtaxOxRPvjZXqXttv1wd5U0vVSUZg5_W6KmT/exec";

// sendVideoLog と sendUsageLog を統一・詳細ログ出力
function postLog(payload) {
  // viewed イベントはガチャ起点のものだけ残す（modal 等からの再生は記録しない）
  if (payload && payload.eventType === "viewed" && payload.eventSource !== "gacha") {
    console.log("postLog: Skipping 'viewed' log because eventSource is not 'gacha':", payload.eventSource);
    return Promise.resolve({ skipped: true });
  }

  return fetch(LOG_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8" },
    body: "data=" + encodeURIComponent(JSON.stringify(payload))
  })
  .then(async res => {
    const text = await res.text().catch(() => "");
    console.log("postLog: status=", res.status, "ok=", res.ok);
    console.log("postLog: response text:", text);
    try { return JSON.parse(text); } catch (e) { return { raw: text, status: res.status }; }
  });
}

// 変更: sendUsageLog/sendVideoLog は postLog を return して Promise を返すようにする
function sendVideoLog({ userId, storeId, storeName, prizeType, salonId, eventSource }) {
  const payload = {
    timestamp: new Date().toISOString(),
    userId, storeId, storeName, prizeType, salonId,
    eventType: "viewed",
    eventSource: eventSource || null,
    gachaCompleted: localStorage.getItem("gachaCompleted") === "true"
  };
  return postLog(payload)
    .then(json => { console.log("sendVideoLog ok:", json); return json; })
    .catch(err => { console.error("sendVideoLog error:", err); throw err; });
}

function sendUsageLog({ userId, storeId, storeName, prizeType, salonId }) {
  const payload = {
    timestamp: new Date().toISOString(),
    userId, storeId, storeName, prizeType, salonId,
    eventType: "used",
    gachaCompleted: localStorage.getItem("gachaCompleted") === "true"
  };

  // --- 重複送信対策（簡易デデュープ） ---
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
  console.trace(); // 呼び出し元追跡用
  return postLog(payload)
    .then(json => { console.log("sendUsageLog ok:", json); return json; })
    .catch(err => { console.error("sendUsageLog error:", err); throw err; });
}

function playFullScreenVideo(videoUrl) {
  if (!videoUrl) {
    alert("動画URLが登録されていません");
    return;
  }

  // ✅ 視聴ログ送信
  if (currentStore) {
    sendVideoLog({
      userId: localStorage.getItem("userId"),
      storeId: currentStore.storeId,
      storeName: currentStore.name,
      prizeType: currentStore.prizeType || "unknown",
      salonId: getSalonId(currentStore.prizeType || "unknown")
    });
  }

  // 既存の動画があれば削除
  const existing = document.querySelector(".fullscreen-video");
  if (existing) existing.remove();

  const videoContainer = document.createElement("div");
  videoContainer.className = "fullscreen-video";
  videoContainer.innerHTML = `
    <video src="${videoUrl}" controls autoplay style="width: 100%; height: 100%; object-fit: contain;"></video>
    <button class="close-video-button">×</button>
  `;
  document.body.appendChild(videoContainer);

  const videoElement = videoContainer.querySelector("video");
  const closeButton = videoContainer.querySelector(".close-video-button");

  closeButton.addEventListener("click", () => {
    videoElement.pause();
    videoContainer.remove();
  });

  videoElement.addEventListener("ended", () => {
    videoContainer.remove();
  });
}

// 既にある宣言（もしなければ追加）
let currentPhotoIndex = 0;
let currentStore = null;

function updatePhoto(images) {
  const photo = document.getElementById("modal-photo");
  if (!images || images.length === 0) {
    photo.src = "images/sample1.jpg"; // 代替画像
    return;
  }
  photo.src = images[currentPhotoIndex];
}

document.getElementById("prev-photo").addEventListener("click", (e) => {
  e.stopPropagation();
  if (!currentStore || !currentStore.images) return;
  currentPhotoIndex = (currentPhotoIndex - 1 + currentStore.images.length) % currentStore.images.length;
  updatePhoto(currentStore.images);
});

document.getElementById("next-photo").addEventListener("click", (e) => {
  e.stopPropagation();
  if (!currentStore || !currentStore.images) return;
  currentPhotoIndex = (currentPhotoIndex + 1) % currentStore.images.length;
  updatePhoto(currentStore.images);
});

let touchStartX = 0;

const photoElement = document.getElementById("modal-photo");

photoElement.addEventListener("touchstart", (e) => {
  touchStartX = e.changedTouches[0].screenX;
});

photoElement.addEventListener("touchend", (e) => {
  const touchEndX = e.changedTouches[0].screenX;
  const deltaX = touchEndX - touchStartX;

  if (!currentStore || !currentStore.images) return;

  if (deltaX > 50) {
    // 左スワイプ → 前の写真
    currentPhotoIndex = (currentPhotoIndex - 1 + currentStore.images.length) % currentStore.images.length;
    updatePhoto(currentStore.images);
  } else if (deltaX < -50) {
    // 右スワイプ → 次の写真
    currentPhotoIndex = (currentPhotoIndex + 1) % currentStore.images.length;
    updatePhoto(currentStore.images);
  }
});

document.querySelector(".close-button").addEventListener("click", () => {
  document.getElementById("restaurant-modal").classList.add("hidden");
});

document.querySelector("#coupon-modal .close-button").addEventListener("click", () => {
  document.getElementById("coupon-modal").classList.add("hidden");
});

function showThankYou(callback) {
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
  document.body.appendChild(thankYou);

  setTimeout(() => {
    thankYou.remove();
    if (callback) callback();
  }, 1500);
}

// openModal(store) の中で currentStore を確実にセットする（openModal の定義内の該当箇所を置換／追記）
function openModal(store) {
  if (!store.unlocked) {
    alert("この店舗はまだアンロックされていません！");
    return;
  }
  currentStore = store;

  // 追加：モーダル表示時に現在の店舗情報を保持する
  const modal = document.getElementById("restaurant-modal");
  if (!modal) return;
  modal.querySelector(".modal-store-name").textContent = store.name || "店舗名";
  modal.querySelector("#modal-photo").src = (store.images && store.images[0]) ? store.images[0] : "images/sample1.jpg";
  modal.querySelector(".modal-town").textContent = `📍 所在地：${store.town || "未設定"}`;
  modal.querySelector(".modal-hours").textContent = `🕒 営業時間：${store.hours || "未設定"}`;
  modal.querySelector(".map-button").href = store.mapUrl;
  modal.querySelector(".video-button").addEventListener("click", (e) => {
    e.preventDefault();
    playFullScreenVideo(store.videoUrl);
  });
  const hpButton = modal.querySelector(".hp-button");
  const hpBadge = modal.querySelector(".hp-badge");

  if (store.hpUrl) {
    hpButton.href = store.hpUrl;
    hpButton.style.display = "inline-block";
    hpButton.setAttribute("target", "_blank");
    hpBadge.style.display = "none";
  } else {
    hpButton.href = "#";
    hpButton.style.display = "none";
    hpBadge.style.display = "inline-block";
  }

  currentStore = store;
  currentPhotoIndex = 0;
  updatePhoto(store.images);

  modal.classList.remove("hidden");
}

// 確定ボタン（クーポン使用）のハンドラを確実に currentStore を参照するように登録
document.addEventListener("DOMContentLoaded", () => {
  const confirmBtn = document.querySelector(".confirm-use-button");
  if (confirmBtn) {
    confirmBtn.addEventListener("click", () => {
      const userId = localStorage.getItem("userId") || "未設定";

      // currentStore がセットされているか確認して値を決定
      const salonId = (currentStore && currentStore.salonId) ? currentStore.salonId : (localStorage.getItem("salonId") || "未設定");
      const storeId = (currentStore && (currentStore.storeId || currentStore.id)) ? (currentStore.storeId || currentStore.id) : "未設定";
      const storeName = (currentStore && currentStore.name) ? currentStore.name : "未設定";
      const prizeType = (currentStore && currentStore.prizeType) ? currentStore.prizeType : "未設定";

      console.log("confirm-use: sending usage log", { userId, salonId, storeId, storeName, prizeType });

      markCouponUsedAndSync(storeId)
        .then(() => {
          return sendUsageLog({ userId, storeId, storeName, prizeType, salonId }).catch(e => { console.warn("sendUsageLog after mark failed:", e); });
        })
        .then(() => {
          const couponModal = document.getElementById("coupon-modal");
          if (couponModal) couponModal.classList.add("hidden");
          const keyInput = document.getElementById("key-input");
          if (keyInput) keyInput.value = "";
          renderCoupons();
        })
        .catch(err => {
          console.warn("confirm click: sync failed, applying local fallback:", err);
          const couponModal = document.getElementById("coupon-modal");
          if (couponModal) couponModal.classList.add("hidden");
          const keyInput = document.getElementById("key-input");
          if (keyInput) keyInput.value = "";
          renderCoupons();
        });
    });
  } else {
    console.warn("confirm-use-button not found");
  }
});

/**
 * クーポンをローカルで「使用済み」にしてサーバへ同期する
 * couponId は myCoupons_{userId} 配列内の一意の識別子（storeId 等）を想定
 */
function markCouponUsedAndSync(couponIdentifier) {
  try {
    const userId = localStorage.getItem("userId");
    if (!userId) return Promise.resolve({ skipped: true });

    const couponsKey = `myCoupons_${userId}`;
    const restaurantsKey = `restaurantData_${userId}`;

    const coupons = JSON.parse(localStorage.getItem(couponsKey) || "[]");
    const restaurants = JSON.parse(localStorage.getItem(restaurantsKey) || "[]");

    let found = false;
    let targetStoreId = null;
    for (let i = 0; i < coupons.length; i++) {
      const c = coupons[i];
      if (c.id === couponIdentifier || c.storeId === couponIdentifier) {
        if (!c.used) {
          c.used = true;
          c.usedAt = new Date().toISOString();
          coupons[i] = c;
          found = true;
        }
        targetStoreId = c.storeId || c.storeId;
        break;
      }
    }

    // restaurants 側にも反映（storeId で一致させる）
    if (targetStoreId) {
      for (let j = 0; j < restaurants.length; j++) {
        const s = restaurants[j];
        if (s.storeId === targetStoreId) {
          s.couponUsed = true;
          restaurants[j] = s;
          break;
        }
      }
    }

    // ローカル保存 & UI 更新
    localStorage.setItem(couponsKey, JSON.stringify(coupons));
    localStorage.setItem(restaurantsKey, JSON.stringify(restaurants));
    try { renderCoupons(); } catch(e){}

    // 一回だけ集約して送る
    const snapshot = {
      coupons: coupons,
      restaurantData: restaurants,
      gachaState: JSON.parse(localStorage.getItem(`gachaState_${userId}`) || "{}")
    };
    stateSync.requestSave(snapshot);
    return Promise.resolve({ ok: true, applied: found });
  } catch (err) {
    console.warn("markCouponUsedAndSync failed:", err);
    return Promise.reject(err);
  }
}

// 安全 wrapper: stateSync がなければ従来の saveGachaStateToServer を使う
function requestSaveSnapshotSafe(snapshot, immediate) {
  if (window.stateSync) {
    if (immediate) return window.stateSync.flushNow();
    window.stateSync.requestSave(snapshot);
    return Promise.resolve({ queued: true });
  }
  // フォールバック: 既存の saveGachaStateToServer があれば使う
  if (typeof saveGachaStateToServer === "function") {
    return saveGachaStateToServer(snapshot, { immediate: !!immediate });
  }
  // 最終フォールバック: 直接 POST
  try {
    const LOG_URL_FALLBACK = "https://script.google.com/macros/s/AKfycbxTsZVOZfn5xoySkypMrYt_6pd0xtNcTtaxOxRPvjZXqXttv1wd5U0vVSUZg5_W6KmT/exec";
    const url = (typeof LOG_URL !== "undefined") ? LOG_URL : (window.LOG_URL || LOG_URL_FALLBACK);
    const userId = localStorage.getItem("userId");
    if (!userId) return Promise.resolve({ skipped: true });
    const payload = { eventType: "saveState", userId: userId, state: snapshot || {} };
    return fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8" },
      body: "data=" + encodeURIComponent(JSON.stringify(payload))
    }).then(r => r.text()).then(t => { try { return JSON.parse(t); } catch(e){ return { raw: t }; }});
  } catch (e) {
    return Promise.reject(e);
  }
}

// coupon の使用処理内では stateSync を直接参照せず上の wrapper を呼ぶようにしてください。
// 例: requestSaveSnapshotSafe(snapshot) または requestSaveSnapshotSafe(snapshot, true)

// coupon.js: stateSync フォールバック（存在しない場合は簡易版を使う）
if (typeof window.stateSync === "undefined") {
  window.stateSync = {
    requestSave: function(snapshot) { console.warn("stateSync missing: requestSave called", snapshot); return; },
    flushNow: function() { return Promise.resolve({ skipped: true }); },
    pause: function(){},
    resume: function(){},
    _debugState: function(){ return {}; }
  };
}