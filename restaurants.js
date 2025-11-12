const currentUserId = localStorage.getItem("userId") || "";
const restaurantsKeyTop = `restaurantData_${currentUserId}`;
let restaurantData = JSON.parse(localStorage.getItem(restaurantsKeyTop) || "[]");

if (!Array.isArray(restaurantData) || restaurantData.length === 0) {
  console.warn("店舗データが配列ではないか空です。window.initialRestaurantData から初期化します");
  restaurantData = Array.isArray(window.initialRestaurantData) ? window.initialRestaurantData.slice() : [];
  // userId がある場合は localStorage に保存しておく
  if (currentUserId) {
    localStorage.setItem(restaurantsKeyTop, JSON.stringify(restaurantData));
  }
}

document.querySelector(".close-button").addEventListener("click", () => {
  const modal = document.getElementById("restaurant-modal");
  modal.classList.add("hidden");
});

const closeBtn = document.querySelector(".close-button");
if (closeBtn) {
  closeBtn.addEventListener("click", () => {
    const modal = document.getElementById("restaurant-modal");
    modal.classList.add("hidden");
  });
}

function playFullScreenVideo(videoUrl) {
  if (!videoUrl) {
    alert("動画URLが登録されていません");
    return;
  }

  // 🔧 既存の動画オーバーレイがあれば削除
  const existingOverlay = document.querySelector(".fullscreen-video");
  if (existingOverlay) {
    existingOverlay.remove();
  }

  const videoOverlay = document.createElement("div");
  videoOverlay.className = "fullscreen-video";
  videoOverlay.innerHTML = `
    <video src="${videoUrl}" controls autoplay style="width: 100%; height: 100%; object-fit: contain;"></video>
    <button class="close-video-button">×</button>
  `;
  document.body.appendChild(videoOverlay);

  const videoElement = videoOverlay.querySelector("video");
  const closeButton = videoOverlay.querySelector(".close-video-button");

  // ✅ 閉じるボタンで停止＆削除
  closeButton.addEventListener("click", () => {
    videoElement.pause();
    videoOverlay.remove();
  });

  // ✅ 再生終了で自動削除
  videoElement.addEventListener("ended", () => {
    videoOverlay.remove();
  });
}
    
// 店舗カードの描画
function renderRestaurants() {
  console.log('DBG: renderRestaurants called sample:', (restaurantArray||[]).slice(0,8).map(r=>({
    storeId: r.storeId,
    unlocked: r.unlocked,
    couponUsed: (r.coupon && r.coupon.used),
    couponPresent: !!r.coupon
  })));
  try {
    const userId = localStorage.getItem("userId");
    const restaurantsKey = `restaurantData_${userId}`;
    const couponsKey = `myCoupons_${userId}`;

    const restaurants = JSON.parse(localStorage.getItem(restaurantsKey) || "[]");
    const coupons = JSON.parse(localStorage.getItem(couponsKey) || "[]");

    console.info("renderRestaurants start", {
      userId,
      restaurantsKey,
      restaurantsLength: Array.isArray(restaurants) ? restaurants.length : typeof restaurants,
      couponsLength: Array.isArray(coupons) ? coupons.length : typeof coupons
    });

    // --- group by baseId （baseId がなければ storeId を代用） ---
    const groups = {};
    restaurants.forEach(s => {
      const key = s.baseId || s.storeId || s.id || "__unknown__";
      if (!groups[key]) groups[key] = [];
      groups[key].push(s);
    });

    // Build array of representative stores (one per baseId)
    const storesToRender = Object.keys(groups).map(key => {
      const group = groups[key];
      // 優先： unlocked なエントリ、なければ最初のエントリ
      const rep = group.find(x => x.unlocked) || group[0];
      // attach original group for coupon-checking if needed
      rep._variants = group;
      rep._baseKey = key;
      return rep;
    });

    console.info("renderRestaurants: base-store count:", storesToRender.length);

    // helper: check whether any variant in the group has coupon in coupons[]
    function isCouponUsedForGroup(groupVariants) {
      if (!Array.isArray(groupVariants) || groupVariants.length === 0) return false;
      return coupons.some(c => {
        const cIds = [c.baseId, c.storeId, c.id].filter(Boolean);
        if (cIds.length === 0) return false;
        return groupVariants.some(variant => {
          const vIds = [variant.baseId, variant.storeId, variant.id].filter(Boolean);
          return cIds.some(cid => vIds.includes(cid));
        });
      });
    }

    // recompute couponUsed for each representative
    let changed = false;
    storesToRender.forEach(rep => {
      const used = isCouponUsedForGroup(rep._variants);
      if (rep.couponUsed !== used) {
        rep.couponUsed = used;
        changed = true;
      }
    });

    // 保存は per-user の restaurantData に保存しておく（完全上書きで問題なければ）
    if (changed) {
      try {
        // 注意: restaurantsKey は元の配列（storeId 単位）を期待する箇所があるため、
        // ここでは元配列を書き換えず、代表配列を別キーに保存する選択肢もあります。
        // とりあえず元配列の各要素に couponUsed を反映して保存しておく。
        const updated = restaurants.map(s => {
          // 各 variant の couponUsed は、その variant の base group の rep の値に合わせる
          const baseKey = s.baseId || s.storeId || s.id || "__unknown__";
          const rep = storesToRender.find(r => r._baseKey === baseKey);
          if (rep) s.couponUsed = !!rep.couponUsed;
          return s;
        });
        localStorage.setItem(restaurantsKey, JSON.stringify(updated));
        console.info("renderRestaurants: updated restaurants saved to", restaurantsKey);
      } catch (e) {
        console.warn("renderRestaurants: failed to persist updated restaurants:", e);
      }
    }

    // --- コンテナを HTML 側の ID/CSS に合わせて柔軟に取得（優先は #restaurant-container） ---
    let container = document.getElementById("restaurant-container")
      || document.getElementById("restaurants-container")
      || document.querySelector("#restaurantsContainer")
      || document.querySelector(".restaurants-container")
      || document.querySelector(".restaurant-list")
      || document.querySelector(".restaurants")
      || document.querySelector("main")
      || document.body;

    console.info("renderRestaurants: resolved container:", container && (container.id || container.className || container.tagName));

    // もし HTML に例示用カードが静的に入っている container を使っているなら innerHTML をクリアして置き換える
    if (container) {
      container.innerHTML = "";
    } else {
      console.warn("renderRestaurants: no container found - aborting render");
      return;
    }

    // 実際のレンダリング：baseId 単位の代表配列を描画（期待通り 10 件）
    let appended = 0;
    storesToRender.forEach((store, idx) => {
      try {
        const card = document.createElement("div");
        card.className = "restaurant-card";
        if (store.unlocked) card.classList.add("unlocked"); else card.classList.add("locked");
        // store.storeId は代表の storeId（表示や modal 用に保持）
        card.dataset.storeId = store.storeId || "";

        card.innerHTML = store.unlocked ? `
          <h3 class="store-name">${store.name || "店舗"}</h3>
          <div class="card-content">
            <img src="${(store.images && store.images[0]) ? store.images[0] : 'images/sample1.jpg'}" alt="店舗写真" class="store-image" />
            <div class="store-details">
              <p class="store-genre">${store.genre || '－'}</p>
              <p class="store-town">${store.town || '－'}</p>
              <p class="coupon-status ${store.couponUsed ? "used" : "unused"}">
                ${store.couponUsed ? "クーポン：済" : "クーポン：未"}
              </p>
            </div>
          </div>
        ` : `
          <h3 class="store-name">ガチャで開放</h3>
          <div class="card-content">
            <img src="images/secret_image.png" alt="非公開画像" class="store-image locked-image" />
            <div class="store-details">
              <p class="store-genre">？？？</p>
              <p class="store-town">？？？</p>
              <p class="coupon-status unused">クーポン：未</p>
            </div>
          </div>
          <div class="lock-overlay">
            <img src="images/rock_chain.png" alt="ロック中" class="lock-image" />
          </div>
        `;

        card.addEventListener("click", () => {
          const storeId = card.dataset.storeId;
          // find the representative store (or first matching variant)
          const target = storesToRender.find(s => s.storeId === storeId) || storesToRender[idx];
          if (target) openModal(target);
        });

        container.appendChild(card);
        appended++;
        if (appended <= 5) {
          console.info("renderRestaurants: appended idx", idx, "baseKey", store._baseKey, "storeId", store.storeId, "unlocked", !!store.unlocked, "couponUsed", !!store.couponUsed);
        }
      } catch (e) {
        console.error("renderRestaurants: failed to render base idx", idx, store, e);
      }
    });

    console.info("renderRestaurants completed, appended:", appended);
  } catch (err) {
    console.error("renderRestaurants: unexpected error", err);
  }
}

// ポップアップ表示処理
let currentPhotoIndex = 0;
let currentStore = null;

function openModal(store) {
  if (!store.unlocked) {
    alert("この店舗はまだアンロックされていません！");
    return;
  }
  currentStore = store;
  const modal = document.getElementById("restaurant-modal");
  modal.querySelector(".modal-store-name").textContent = store.name;
  modal.querySelector(".modal-town").textContent = `所在地：${store.town}`;
  modal.querySelector(".modal-status").textContent =
    `${store.couponUsed ? "クーポン：済" : "クーポン：未"}`;
  modal.querySelector(".modal-hours").textContent = `営業時間：${store.hours}`;
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

  currentPhotoIndex = 0;
  updatePhoto(store.images);

  modal.classList.remove("hidden");
}

function updatePhoto(images) {
  const photo = document.getElementById("modal-photo");
  if (!images || images.length === 0) {
    photo.src = "images/sample1.jpg"; // 代替画像
    return;
  }
  photo.src = images[currentPhotoIndex];
}

document.getElementById("prev-photo").addEventListener("click", () => {
  if (!currentStore) return;
  currentPhotoIndex = (currentPhotoIndex - 1 + currentStore.images.length) % currentStore.images.length;
  updatePhoto(currentStore.images);
});

document.getElementById("next-photo").addEventListener("click", () => {
  if (!currentStore) return;
  currentPhotoIndex = (currentPhotoIndex + 1) % currentStore.images.length;
  updatePhoto(currentStore.images);
});

function ensureRestaurantDataInitialized() {
  const userId = localStorage.getItem("userId");
  const key = `restaurantData_${userId}`;
  const currentData = JSON.parse(localStorage.getItem(key));

  if (!Array.isArray(currentData) || currentData.length === 0) {
    localStorage.setItem(key, JSON.stringify(window.initialRestaurantData));
    console.log("店舗データを初期化しました:", key);
  }
}

// 既存の DOMContentLoaded ハンドラ（もし同種のものが複数あればまとめて1つに）
document.addEventListener("DOMContentLoaded", async () => {
  const userId = localStorage.getItem("userId");

  // 1) サーバ上の state が利用可能ならロードして local に適用してから描画
  try {
    if (userId && typeof window.loadGachaStateFromServer === "function") {
      const res = await window.loadGachaStateFromServer(userId);

      // 修正点: status を大小区別せず判定、または status が微妙でも found/state があれば適用する
      const statusOk = res && res.status && String(res.status).toLowerCase() === "ok";
      if (res && (statusOk || (res.found && res.state))) {
        try {
          // applyServerStateToLocal があれば任せる
          if (typeof window.applyServerStateToLocal === "function") {
            window.applyServerStateToLocal(res.state ? { found: true, state: res.state } : res, userId);
            console.info("restaurants.js: server state applied for", userId);

            // 追記: applyServerStateToLocal が内部で myCoupons_<userId> を書かない場合に備え、
            // サーバから coupons が来ていれば明示的に localStorage に保存しておく
            try {
              if (res && res.state && Array.isArray(res.state.coupons) && res.state.coupons.length > 0) {
                const couponsKey = `myCoupons_${userId}`;
                localStorage.setItem(couponsKey, JSON.stringify(res.state.coupons));
                console.info("restaurants.js: applied coupons to localStorage:", couponsKey);
              } else {
                console.info("restaurants.js: server state had no coupons or empty coupons array");
              }
            } catch (e) {
              console.warn("restaurants.js: failed to write coupons into localStorage:", e);
            }
          } else {
            // 互換性が合わない場合に備えて直接保存も行っておく
            if (res.state) {
              if (res.state.restaurantData) localStorage.setItem(`restaurantData_${userId}`, JSON.stringify(res.state.restaurantData));
              if (res.state.coupons) localStorage.setItem(`myCoupons_${userId}`, JSON.stringify(res.state.coupons));
              if (res.state.gachaState) localStorage.setItem(`gachaState_${userId}`, JSON.stringify(res.state.gachaState));
              console.info("restaurants.js: fallback applied server state");
            }
          }
        } catch (e) {
          // 万一 applyServerStateToLocal が投げたら fallback で local に書く
          if (res.state) {
            if (res.state.restaurantData) localStorage.setItem(`restaurantData_${userId}`, JSON.stringify(res.state.restaurantData));
            if (res.state.coupons) localStorage.setItem(`myCoupons_${userId}`, JSON.stringify(res.state.coupons));
            if (res.state.gachaState) localStorage.setItem(`gachaState_${userId}`, JSON.stringify(res.state.gachaState));
            console.info("restaurants.js: fallback applied server state after exception");
          }
        }
      } else {
        console.info("restaurants.js: no server state or not found", res);
      }
    }
  } catch (e) {
    console.warn("restaurants.js: failed to load/apply server state:", e);
  }

  // 2) ローカル初期化 → 描画
  ensureRestaurantDataInitialized();
  renderRestaurants();

  // 3) モーダル写真スワイプ登録（既存コードと重複しないよう維持）
  const modalPhoto = document.getElementById("modal-photo");
  if (modalPhoto) {
    modalPhoto.addEventListener("touchstart", (e) => {
      touchStartX = e.changedTouches[0].screenX;
    });
    modalPhoto.addEventListener("touchend", (e) => {
      touchEndX = e.changedTouches[0].screenX;
      handleSwipe();
    });
  }
});

// 4) 別タブで localStorage が更新されたら自動で再描画（storage イベント）
window.addEventListener("storage", (e) => {
  try {
    const userId = localStorage.getItem("userId");
    if (!userId) return;
    if (e.key === `restaurantData_${userId}` || e.key === `myCoupons_${userId}` || e.key === `gachaState_${userId}`) {
      console.info("restaurants.js: storage event detected, key=", e.key);
      renderRestaurants();
    }
  } catch (err) {
    console.warn("restaurants.js: storage handler error", err);
  }
});

// PR動画を再生するハンドラ（モーダルから）
function playModalPR(store) {
  // 動画再生だけ行う（ログは送らない）
  prVideo.src = store.videoUrl;
  prVideo.play();

  // もし既にどこかで sendVideoLog が呼ばれているなら、ここでは呼ばないか
  // sendVideoLog({... , eventSource: "modal"});
}

// ---- START: applyServerStateToLocal ----
async function applyServerStateToLocal(serverState, userId) {
  window.__applyingServerState = true;
  // pause stateSync if possible to avoid it triggering save while we write
  const paused = (window.stateSync && typeof window.stateSync.pause === 'function') ? (() => { try { window.stateSync.pause(); return true; } catch(e){ return false; } })() : false;

  try {
    if (!userId) userId = localStorage.getItem('userId');
    if (!userId) {
      console.warn('applyServerStateToLocal: no userId');
      return;
    }

    // serverState may have: coupons, restaurantData, gachaState
    const serverCoupons = (serverState && serverState.coupons) ? serverState.coupons : [];
    const serverRestaurants = (serverState && serverState.restaurantData) ? serverState.restaurantData : [];
    const serverGacha = (serverState && serverState.gachaState) ? serverState.gachaState : null;

    // Local keys
    const couponsKey = `myCoupons_${userId}`;
    const restaurantsKey = `restaurantData_${userId}`;
    const gachaKey = `gachaState_${userId}`;

    // Merge coupons: server first, but keep local.used === true (OR rule). Use storeId/id/baseId as key.
    const map = new Map();
    const keyOf = (c) => c && (c.storeId || c.id || c.baseId || JSON.stringify(c));

    (serverCoupons || []).forEach(c => {
      const k = keyOf(c);
      map.set(k, Object.assign({}, c, { used: !!c.used, usedAt: c.usedAt || null }));
    });

    let localCoupons = [];
    try { localCoupons = JSON.parse(localStorage.getItem(couponsKey) || '[]'); } catch(e){ localCoupons = []; }

    (localCoupons || []).forEach(c => {
      const k = keyOf(c);
      const existing = map.get(k);
      if (existing) {
        // keep used = existing.used || local.used (OR)
        existing.used = !!existing.used || !!c.used;
        if (!existing.used && c.used && c.usedAt) existing.usedAt = c.usedAt;
        map.set(k, existing);
      } else {
        map.set(k, Object.assign({}, c));
      }
    });

    const mergedCoupons = Array.from(map.values());
    localStorage.setItem(couponsKey, JSON.stringify(mergedCoupons));
    console.log('applyServerStateToLocal: mergedCoupons written,', mergedCoupons.length);

    // Restaurants: server priority; if local has extra fields like couponUsed from UI, try to merge that boolean
    let localRestaurants = [];
    try { localRestaurants = JSON.parse(localStorage.getItem(restaurantsKey) || '[]'); } catch(e){ localRestaurants = []; }

    const rmap = new Map();
    const rKeyOf = (r) => r && (r.storeId || r.id || r.baseId || JSON.stringify(r));

    (serverRestaurants || []).forEach(r => {
      rmap.set(rKeyOf(r), Object.assign({}, r));
    });

    (localRestaurants || []).forEach(r => {
      const k = rKeyOf(r);
      const existing = rmap.get(k);
      if (existing) {
        // preserve couponUsed if local had true
        existing.couponUsed = !!existing.couponUsed || !!r.couponUsed;
        rmap.set(k, existing);
      } else {
        rmap.set(k, Object.assign({}, r));
      }
    });

    const mergedRestaurants = Array.from(rmap.values());
    localStorage.setItem(restaurantsKey, JSON.stringify(mergedRestaurants));
    console.log('applyServerStateToLocal: mergedRestaurants written,', mergedRestaurants.length);

    // gachaState: prefer server if present, otherwise preserve local
    if (serverGacha) {
      localStorage.setItem(gachaKey, JSON.stringify(serverGacha));
      console.log('applyServerStateToLocal: gachaState written from server');
    } else {
      // keep existing local gacha
      console.log('applyServerStateToLocal: server gachaState not present; leaving local gacha');
    }

    // UI 更新
    try { if (typeof window.renderCoupons === 'function') window.renderCoupons(); } catch(e){ console.warn(e); }
    try { if (typeof window.renderRestaurants === 'function') window.renderRestaurants(); } catch(e){ console.warn(e); }

  } finally {
    // restore
    window.__applyingServerState = false;
    if (paused && window.stateSync && typeof window.stateSync.resume === 'function') {
      try { window.stateSync.resume(); } catch(e){ console.warn('resume failed', e); }
    }
  }
}
// ---- END: applyServerStateToLocal ----

// 例: fetch exec?action=getState... の then(parsedServerState => { ... })
if (parsedServerState) {
  applyServerStateToLocal(parsedServerState, localStorage.getItem('userId'));
} else {
  // fallback: nothing to apply
}

function computeCouponStatus(store) {
  // 優先順位：nested coupon.used OR top-level couponUsed => used
  const nestedUsed = store.coupon && (store.coupon.used === true);
  const topUsed = (typeof store.couponUsed !== 'undefined') && store.couponUsed === true;
  if (nestedUsed || topUsed) return 'used';
  if (store.unlocked) return 'unlocked';
  return 'locked';
}

// renderRestaurants 内、カード描画前に computeCouponStatus を呼んで表示を制御してください。
// 例（概念）:
// const status = computeCouponStatus(store);
// if (status === 'used') { /* show used UI */ }
// else if (status === 'unlocked') { /* show unlocked UI */ }
// else { /* show locked UI */ }


