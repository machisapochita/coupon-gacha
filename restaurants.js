// restaurants.js — 統一版（CSS 互換 DOM 構造 + 安全な描画 + 正しいクリック挙動）

// --- 初期化 ---
const currentUserId = localStorage.getItem("userId") || "";
const restaurantsKeyTop = `restaurantData_${currentUserId}`;

(function ensurePerUserData() {
  try {
    const raw = localStorage.getItem(restaurantsKeyTop);
    if (!raw) {
      const seed = Array.isArray(window.initialRestaurantData) ? window.initialRestaurantData.slice() : [];
      if (currentUserId) localStorage.setItem(restaurantsKeyTop, JSON.stringify(seed));
    }
  } catch (e) {
    console.warn("ensurePerUserData failed:", e);
  }
})();

// --- ユーティリティ: プレースホルダ画像や DOM 取得の安全化 ---
function safeGetById(id) { try { return document.getElementById(id); } catch(e){ return null; } }
const LOCK_IMG = "images/rock_chain.png";
const PLACEHOLDER_IMG = "images/sample1.jpg";

// --- モーダル / 動画再生 ハンドラ ---
function playFullScreenVideo(videoUrl) {
  if (!videoUrl) { alert("動画URLが登録されていません"); return; }
  const existingOverlay = document.querySelector(".fullscreen-video");
  if (existingOverlay) existingOverlay.remove();

  const videoOverlay = document.createElement("div");
  videoOverlay.className = "fullscreen-video";
  videoOverlay.innerHTML = `
    <video src="${videoUrl}" controls autoplay style="width:100%;height:100%;object-fit:contain;"></video>
    <button class="close-video-button">×</button>
  `;
  document.body.appendChild(videoOverlay);
  const v = videoOverlay.querySelector("video");
  const btn = videoOverlay.querySelector(".close-video-button");
  btn.addEventListener("click", () => { try { v.pause(); } catch(e){} videoOverlay.remove(); });
  v.addEventListener("ended", () => { videoOverlay.remove(); });
}

let currentStoreForModal = null;
function openModal(store) {
  if (!store) return;
  if (!store.unlocked) {
    alert("この店舗はまだアンロックされていません！");
    return;
  }
  currentStoreForModal = store;
  const modal = safeGetById("restaurant-modal");
  if (!modal) {
    // フォールバック: 直接動画（最低限）
    if (store.videoUrl) playFullScreenVideo(store.videoUrl);
    return;
  }

  // 既存 HTML の要素を埋める（存在チェック付き）
  const nameEl = modal.querySelector(".modal-store-name");
  if (nameEl) nameEl.textContent = store.name || "";

  const townEl = modal.querySelector(".modal-town");
  if (townEl) townEl.textContent = `📍 所在地：${store.town || ""}`;

  const hoursEl = modal.querySelector(".modal-hours");
  if (hoursEl) hoursEl.textContent = `🕒 営業時間：${store.hours || ""}`;

  const statusEl = modal.querySelector(".modal-status");
  if (statusEl) statusEl.textContent = (store.couponUsed ? "クーポン：済" : "クーポン：未使用");

  const photo = modal.querySelector("#modal-photo");
  if (photo) photo.src = (store.images && store.images[0]) ? store.images[0] : PLACEHOLDER_IMG;

  const mapButton = modal.querySelector(".map-button");
  if (mapButton) mapButton.href = store.mapUrl || "#";

  const videoButton = modal.querySelector(".video-button");
  if (videoButton) {
    // クリックでモーダル内の動画再生ではなく、フルスクリーン再生を呼ぶ
    videoButton.onclick = (e) => { e.preventDefault(); if (store.videoUrl) playFullScreenVideo(store.videoUrl); };
  }

  const hpButton = modal.querySelector(".hp-button");
  const hpBadge = modal.querySelector(".hp-badge");
  if (hpButton) {
    if (store.hpUrl) {
      hpButton.href = store.hpUrl;
      hpButton.style.display = "inline-block";
      hpButton.setAttribute("target", "_blank");
      if (hpBadge) hpBadge.style.display = "none";
    } else {
      hpButton.href = "#";
      hpButton.style.display = "none";
      if (hpBadge) hpBadge.style.display = "inline-block";
    }
  }

  // 写真ナビは既存のボタンでハンドリングする（prev/next）
  currentPhotoIndex = 0;
  try { updatePhoto(store.images || []); } catch(e){}

  modal.classList.remove("hidden");
}

// --- レンダラ（HTML サンプル構造に合わせる） ---
function renderRestaurants(restaurantArray) {
  try {
    const userId = localStorage.getItem('userId') || '';
    const key = `restaurantData_${userId}`;

    // myCoupons 取得
    let myCoupons = [];
    try { myCoupons = JSON.parse(localStorage.getItem(`myCoupons_${userId}`) || '[]'); } catch(e){ myCoupons = []; }

    // レストラン配列取得
    let arr = Array.isArray(restaurantArray) ? restaurantArray.slice() : null;
    if (!arr) {
      try {
        const raw = localStorage.getItem(key) || localStorage.getItem('restaurantData') || '[]';
        arr = JSON.parse(raw || '[]');
      } catch (e) {
        console.warn('renderRestaurants: local parse failed', e);
        arr = [];
      }
    }

    const container = document.getElementById('restaurant-container');
    if (!container) {
      console.warn('renderRestaurants: #restaurant-container が見つかりません');
      return;
    }
    container.innerHTML = '';

    if (!Array.isArray(arr) || arr.length === 0) {
      const p = document.createElement('p');
      p.textContent = '表示する店舗がありません。';
      container.appendChild(p);
      return;
    }

    // baseId ごとにグループ化
    const groups = {};
    for (const s of arr) {
      if (!s || !s.baseId) continue;
      (groups[s.baseId] ||= []).push(s);
    }
    const reps = Object.values(groups).map(list => list[0]).slice(0, 10);

    for (const store of reps) {
      const groupList = groups[store.baseId] || [];
      const isLocked = !store.unlocked;

      // baseId 内で使用済みクーポンが存在するか判定
      // 1) クーポン配列から baseId マッチ
      const couponsForBase = myCoupons.filter(c => c && c.storeId && c.storeId.split('-')[0] === store.baseId);
      const anyUsedCouponInCoupons = couponsForBase.some(c => c.used === true);

      // 2) グループ内の店舗状態から使用済み検出
      const anyUsedInGroupFlags = groupList.some(s =>
        s.couponUsed === true ||
        (s.coupon && s.coupon.used === true)
      );

      // 最終使用済みフラグ
      const couponUsedResolved = anyUsedCouponInCoupons || anyUsedInGroupFlags;

      const card = document.createElement('div');
      card.className = 'restaurant-card ' + (isLocked ? 'locked' : 'unlocked');
      if (store.storeId) card.setAttribute('data-store-id', store.storeId);

      // 店名
      const h3 = document.createElement('h3');
      h3.className = 'store-name';
      h3.textContent = isLocked ? '？？？' : (store.name || '店舗名');
      card.appendChild(h3);

      // card-content
      const content = document.createElement('div');
      content.className = 'card-content';

      // 画像
      const img = document.createElement('img');
      img.className = 'store-image';
      if (isLocked) {
        img.src = 'images/secret_image.png';
        img.alt = '秘匿画像';
      } else {
        img.src = (store.images && store.images[0]) ? store.images[0] : 'images/sample1.jpg';
        img.alt = store.name || '店舗写真';
      }
      content.appendChild(img);

      // details
      const details = document.createElement('div');
      details.className = 'store-details';

      const g = document.createElement('p'); g.className = 'store-genre';
      g.textContent = isLocked ? '？？？' : (store.genre || '');
      const t = document.createElement('p'); t.className = 'store-town';
      t.textContent = isLocked ? '？？？' : (store.town || '');

      const c = document.createElement('p'); c.className = 'coupon-status';
      if (couponUsedResolved) {
        c.textContent = 'クーポン：済';
        c.classList.add('used');
      } else if (!isLocked) {
        // baseId にクーポンをまだ獲得していない（= 該当クーポン配列に存在しない）
        if (couponsForBase.length === 0) {
          c.textContent = 'クーポン：未獲得';
        } else {
          c.textContent = 'クーポン：未使用';
          c.classList.add('unused');
        }
      } else {
        c.textContent = 'クーポン：未獲得';
      }

      details.appendChild(g);
      details.appendChild(t);
      details.appendChild(c);
      content.appendChild(details);
      card.appendChild(content);

      // ロックオーバーレイ
      if (isLocked) {
        const overlay = document.createElement('div');
        overlay.className = 'lock-overlay';
        const lockImg = document.createElement('img');
        lockImg.className = 'lock-image';
        lockImg.src = 'images/rock_chain.png';
        lockImg.alt = 'ロック中';
        overlay.appendChild(lockImg);
        card.appendChild(overlay);
      }

      // クリック挙動
      card.addEventListener('click', (e) => {
        e.preventDefault();
        if (isLocked) {
          alert('この店舗はまだアンロックされていません！');
          return;
        }
        try { openModal(store); } catch (err) { console.warn('card click handler failed', err); }
      });

      container.appendChild(card);
    }

    // レンダリング完了後ローディング非表示
    const loadingOverlay = document.getElementById("loading-overlay");
    if (loadingOverlay) loadingOverlay.classList.add("hidden");

  } catch (err) {
    console.error('renderRestaurants failed:', err);
    const loadingOverlay = document.getElementById("loading-overlay");
    if (loadingOverlay) loadingOverlay.classList.add("hidden");
  }
}

// --- applyServerStateToLocal: サーバ状態を安全にローカルへ適用（restaurantsDelta 対応版） ---
function applyServerStateToLocal(payload, userId) {
  if (!payload) {
    console.log('applyServerStateToLocal(restaurants): empty payload');
    return;
  }

  // doGet の戻りを両対応: { state, updatedAt } または state そのもの
  const serverState = payload.state || payload || {};
  const rootUpdatedAt = payload.updatedAt || serverState.updatedAt || 0;

  if (!userId) userId = localStorage.getItem('userId');
  if (!userId) {
    console.warn('applyServerStateToLocal(restaurants): no userId');
    return;
  }

  const gachaKey = `gachaState_${userId}`;
  const restaurantKey = `restaurantData_${userId}`;
  const couponsKey = `myCoupons_${userId}`;

  // 適用中は保存系を抑止（終わりにフラッシュ）
  window.__applyingServerState = true;
  console.log('applyServerStateToLocal(restaurants): start (updatedAt=%s)', rootUpdatedAt);

  try {
    // 1) restaurantData の確保（なければ初期データをセット）
    let localRestaurants = null;
    try {
      localRestaurants = JSON.parse(localStorage.getItem(restaurantKey) || 'null');
    } catch (e) {
      localRestaurants = null;
    }
    if (!Array.isArray(localRestaurants) || localRestaurants.length === 0) {
      const init = (window.initialRestaurantData || []).slice();
      init.updatedAt = init.updatedAt || 0;
      localStorage.setItem(restaurantKey, JSON.stringify(init));
      localRestaurants = init;
    }

    // 2) restaurantsDelta の適用（baseId 単位でアンロック、冪等）
    if (serverState.restaurantsDelta && Array.isArray(serverState.restaurantsDelta.unlockedBaseIds)) {
      const unlockSet = new Set(serverState.restaurantsDelta.unlockedBaseIds);
      let changed = false;
      const next = localRestaurants.map(r => {
        if (r && unlockSet.has(r.baseId) && !r.unlocked) {
          changed = true;
          return Object.assign({}, r, { unlocked: true });
        }
        return r;
      });
      if (changed) {
        next.updatedAt = Math.max(rootUpdatedAt || 0, Date.now());
        localStorage.setItem(restaurantKey, JSON.stringify(next));
        localRestaurants = next;
        console.log('applyServerStateToLocal(restaurants): applied restaurantsDelta (unlocked %d baseIds)', unlockSet.size);
      }
    }

    // 3) フルの restaurantData が来た場合は updatedAt で上書き判定（通常は delta 優先）
    if (Array.isArray(serverState.restaurantData)) {
      const localRestaurantsUpdatedAt = (localRestaurants && localRestaurants.updatedAt) ? localRestaurants.updatedAt : 0;
      if ((rootUpdatedAt || 0) > (localRestaurantsUpdatedAt || 0)) {
        const arr = serverState.restaurantData.slice();
        arr.updatedAt = rootUpdatedAt || Date.now();
        localStorage.setItem(restaurantKey, JSON.stringify(arr));
        localRestaurants = arr;
        console.log('applyServerStateToLocal(restaurants): replaced restaurantData (count=%d)', arr.length);
      } else {
        console.log('applyServerStateToLocal(restaurants): skip restaurantData (local newer)');
      }
    }

    // 4) coupons（サーバが新しければ置き換え）
    if (Array.isArray(serverState.coupons)) {
      let localCoupons = [];
      try { localCoupons = JSON.parse(localStorage.getItem(couponsKey) || '[]'); } catch (e) { localCoupons = []; }
      const localCouponsUpdatedAt = (localCoupons && localCoupons.updatedAt) ? localCoupons.updatedAt : 0;
      if ((rootUpdatedAt || 0) > (localCouponsUpdatedAt || 0)) {
        const nextCoupons = serverState.coupons.slice();
        nextCoupons.updatedAt = rootUpdatedAt || Date.now();
        localStorage.setItem(couponsKey, JSON.stringify(nextCoupons));
        console.log('applyServerStateToLocal(restaurants): applied coupons (count=%d)', nextCoupons.length);
      } else {
        console.log('applyServerStateToLocal(restaurants): skip coupons (local newer)');
      }
    }

    // 5) gachaState（updatedAt で競合回避）
    if (serverState.gachaState) {
      let localGacha = {};
      try { localGacha = JSON.parse(localStorage.getItem(gachaKey) || '{}'); } catch (e) { localGacha = {}; }
      const serverGachaUpdated = serverState.gachaState.updatedAt || rootUpdatedAt || 0;
      const localGachaUpdated = localGacha.updatedAt || 0;
      if (serverGachaUpdated > localGachaUpdated) {
        const merged = Object.assign({}, localGacha, serverState.gachaState);
        if (!merged.updatedAt) merged.updatedAt = serverGachaUpdated;
        localStorage.setItem(gachaKey, JSON.stringify(merged));
        console.log('applyServerStateToLocal(restaurants): applied gachaState (updatedAt=%s)', merged.updatedAt);
      } else {
        console.log('applyServerStateToLocal(restaurants): skip gachaState (local newer)');
      }
    }

    // 6) UI 反映（レンダーとローディング解除）
    try { typeof updateStatusArea === 'function' && updateStatusArea(); } catch (e) {}
    try { typeof renderRestaurants === 'function' && renderRestaurants(); } catch (e) {}
    try {
      const overlay = document.getElementById('loading-overlay');
      if (overlay) overlay.classList.add('hidden');
    } catch (e) {}
  } catch (err) {
    console.error('applyServerStateToLocal(restaurants): error', err);
  } finally {
    // 適用ガード解除と、apply 中にキューされた保存のフラッシュ
    setTimeout(() => {
      window.__applyingServerState = false;
      if (window.__queuedSnapshotUserId && typeof window.saveStateSnapshotNow === 'function') {
        const queuedUid = window.__queuedSnapshotUserId;
        window.__queuedSnapshotUserId = null;
        window.__queuedSnapshot = null;
        try { window.saveStateSnapshotNow(queuedUid); } catch (e) { console.warn('flush queued save failed', e); }
      }
    }, 50);
  }
}

// DOMContentLoaded 初期処理：サーバ state を取りに行って適用 → render
document.addEventListener("DOMContentLoaded", async () => {
  const userId = localStorage.getItem("userId");
  try {
    if (userId && typeof window.loadGachaStateFromServer === "function") {
      const res = await window.loadGachaStateFromServer(userId);
      const statusOk = res && res.status && String(res.status).toLowerCase() === "ok";
      if (res && (statusOk || (res.found && res.state))) {
        // gacha.js に存在する applyServerStateToLocal を優先して委譲
        if (typeof window.applyServerStateToLocal === "function") {
          try { window.applyServerStateToLocal(res.state ? { found: true, state: res.state } : res, userId); }
          catch(e) { applyServerStateToLocal(res, userId); }
        } else {
          applyServerStateToLocal(res, userId);
        }
      }
    }
  } catch (e) {
    console.warn("restaurants init: load/apply failed", e);
  }

  ensureRestaurantDataInitialized();
  renderRestaurants();
});

// storage イベントで別タブ変更を反映
window.addEventListener("storage", (e) => {
  try {
    const userId = localStorage.getItem("userId");
    if (!userId) return;
    if (e.key === `restaurantData_${userId}` || e.key === `myCoupons_${userId}` || e.key === `gachaState_${userId}`) {
      renderRestaurants();
    }
  } catch (err) { console.warn("storage handler:", err); }
});

// --- 既存 modal 用 helpers（画像切替など） ---
let currentPhotoIndex = 0;
function updatePhoto(images) {
  const photo = safeGetById("modal-photo");
  if (!photo) return;
  if (!images || images.length === 0) {
    photo.src = PLACEHOLDER_IMG;
    return;
  }
  photo.src = images[currentPhotoIndex] || images[0] || PLACEHOLDER_IMG;
}
const prevBtn = safeGetById("prev-photo");
const nextBtn = safeGetById("next-photo");
if (prevBtn) prevBtn.addEventListener("click", () => {
  if (!currentStoreForModal || !currentStoreForModal.images) return;
  currentPhotoIndex = (currentPhotoIndex - 1 + currentStoreForModal.images.length) % currentStoreForModal.images.length;
  updatePhoto(currentStoreForModal.images);
});
if (nextBtn) nextBtn.addEventListener("click", () => {
  if (!currentStoreForModal || !currentStoreForModal.images) return;
  currentPhotoIndex = (currentPhotoIndex + 1) % currentStoreForModal.images.length;
  updatePhoto(currentStoreForModal.images);
});

// モーダルの閉じるボタン
(function bindModalClose(){
  const close = document.querySelector(".close-button");
  if (close) close.addEventListener("click", () => {
    const modal = safeGetById("restaurant-modal");
    if (modal) modal.classList.add("hidden");
  });
})();

// --- 互換ラッパ: ensureRestaurantDataInitialized (既存の呼び出しと互換) ---
function ensureRestaurantDataInitialized() {
  try {
    const userId = localStorage.getItem("userId");
    const key = `restaurantData_${userId}`;
    const raw = localStorage.getItem(key);
    // raw が有効な配列としてパースできなければ初期化
    let parsed = null;
    try { parsed = JSON.parse(raw || "null"); } catch(e) { parsed = null; }
    if (!Array.isArray(parsed) || parsed.length === 0) {
      const seed = Array.isArray(window.initialRestaurantData) ? window.initialRestaurantData.slice() : [];
      if (userId) {
        localStorage.setItem(key, JSON.stringify(seed));
        console.info("ensureRestaurantDataInitialized: initialized", key);
      } else {
        // userId 未設定時は legacy キーへ（念のため）
        if (!localStorage.getItem("restaurantData")) {
          localStorage.setItem("restaurantData", JSON.stringify(seed));
          console.info("ensureRestaurantDataInitialized: initialized legacy restaurantData");
        }
      }
    }
  } catch (err) {
    console.warn("ensureRestaurantDataInitialized failed:", err);
  }
}

// --- 同一タブ内で coupon を使ったときに即時反映する用のリスナ ---
window.addEventListener('couponsChanged', () => {
  try {
    renderRestaurants();
    console.info("couponsChanged -> renderRestaurants fired");
  } catch (e) {
    console.warn("couponsChanged handler failed:", e);
  }
});
