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
// 引数で配列を受け取り、container をクリアしてレンダリングする
function renderRestaurants(restaurantArray) {
  if (!Array.isArray(restaurantArray)) restaurantArray = [];

  const container = document.getElementById('restaurant-container');
  if (!container) {
    console.warn('renderRestaurants: restaurant-container not found');
    return;
  }

  // 既存のダミーを消す
  container.innerHTML = '';

  // グルーピング（baseId ごとに1つ表示する等）をしたい場合はここで処理する
  // ここでは baseId ごとに先頭の店舗を代表として表示（最大 10 件）
  const byBase = {};
  for (const r of restaurantArray) {
    if (!byBase[r.baseId]) byBase[r.baseId] = r;
  }
  const repList = Object.values(byBase).slice(0, 10);

  repList.forEach(store => {
    const card = document.createElement('div');
    card.className = 'restaurant-card ' + (store.unlocked ? 'unlocked' : 'locked');
    card.dataset.storeId = store.storeId;

    const title = document.createElement('h3');
    title.className = 'store-name';
    title.textContent = store.name || '';

    const content = document.createElement('div');
    content.className = 'card-content';

    const img = document.createElement('img');
    img.className = 'store-image';
    img.src = (store.images && store.images[0]) ? store.images[0] : 'images/sample1.jpg';
    img.alt = store.name || '店舗写真';

    const details = document.createElement('div');
    details.className = 'store-details';

    const genre = document.createElement('p'); genre.className = 'store-genre'; genre.textContent = store.genre || '';
    const town = document.createElement('p'); town.className = 'store-town'; town.textContent = store.town || '';
    const couponStatus = document.createElement('p'); couponStatus.className = 'coupon-status';

    // coupon.used (nested) or top-level couponUsed の両方を確認
    const nestedUsed = store.coupon && store.coupon.used === true;
    const topUsed = typeof store.couponUsed !== 'undefined' && store.couponUsed === true;
    if (nestedUsed || topUsed) couponStatus.textContent = 'クーポン：済';
    else if (store.unlocked) couponStatus.textContent = 'クーポン：未使用（アンロック済）';
    else couponStatus.textContent = 'クーポン：未獲得';

    details.appendChild(genre);
    details.appendChild(town);
    details.appendChild(couponStatus);

    content.appendChild(img);
    content.appendChild(details);

    card.appendChild(title);
    card.appendChild(content);

    container.appendChild(card);
  });
}
ポップアップ表示処理
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
// server から取得した payload を localStorage に安全に適用し、renderRestaurants を呼ぶ
function applyServerStateToLocal(payload, userId) {
  try {
    if (!payload || !payload.state) {
      console.log('applyServerStateToLocal: no server payload/state, skipping');
      return;
    }

    // 統一名 serverState と parsedServerState の代替
    const serverState = payload.state || {};
    const serverUpdatedAt = payload.updatedAt || serverState.updatedAt || 0;

    const gachaKey = `gachaState_${userId}`;
    const restaurantKey = `restaurantData_${userId}`;
    const couponsKey = `myCoupons_${userId}`;

    // 現在の local を取得（null 安全）
    const localGacha = JSON.parse(localStorage.getItem(gachaKey) || 'null');
    const localRestaurants = JSON.parse(localStorage.getItem(restaurantKey) || 'null');
    const localCoupons = JSON.parse(localStorage.getItem(couponsKey) || 'null');

    // --- gachaState の適用（サーバが新しければ上書き） ---
    if (serverState.gachaState) {
      const serverGachaUpdated = Number(serverState.gachaState.updatedAt || serverUpdatedAt || 0);
      const localGachaUpdated = localGacha && Number(localGacha.updatedAt || 0);

      if (serverGachaUpdated > (localGachaUpdated || 0)) {
        const newGacha = Object.assign({}, serverState.gachaState);
        if (!newGacha.updatedAt) newGacha.updatedAt = serverGachaUpdated;
        localStorage.setItem(gachaKey, JSON.stringify(newGacha));
        console.log('applyServerStateToLocal: applied server gachaState (updatedAt)', newGacha.updatedAt);
      } else {
        console.log('applyServerStateToLocal: leaving local gacha (local is newer)', { localGachaUpdated, serverGachaUpdated });
      }
    } else {
      console.log('applyServerStateToLocal: server gachaState not present; leaving local gacha');
    }

    // --- restaurantData の適用（root updatedAt で判断） ---
    if (Array.isArray(serverState.restaurantData)) {
      const localRestaurantsUpdated = (localRestaurants && localRestaurants.updatedAt) ? Number(localRestaurants.updatedAt) : 0;
      const incomingRootUpdated = Number(serverState.updatedAt || serverUpdatedAt || 0);

      if (incomingRootUpdated > localRestaurantsUpdated) {
        const newRestaurants = Array.isArray(serverState.restaurantData) ? serverState.restaurantData.slice() : [];
        newRestaurants.updatedAt = incomingRootUpdated;
        localStorage.setItem(restaurantKey, JSON.stringify(newRestaurants));
        console.log('applyServerStateToLocal: mergedRestaurants written,', newRestaurants.length);
      } else {
        console.log('applyServerStateToLocal: skipped restaurantData overwrite (local is newer)');
      }
    }

    // --- coupons の適用 ---
    if (Array.isArray(serverState.coupons)) {
      const localCouponsUpdated = (localCoupons && localCoupons.updatedAt) ? Number(localCoupons.updatedAt) : 0;
      const incomingRootUpdated = Number(serverState.updatedAt || serverUpdatedAt || 0);
      if (incomingRootUpdated > localCouponsUpdated) {
        const newCoupons = serverState.coupons.slice();
        newCoupons.updatedAt = incomingRootUpdated;
        localStorage.setItem(couponsKey, JSON.stringify(newCoupons));
        console.log('applyServerStateToLocal: applied coupons to localStorage:', couponsKey);
      } else {
        console.log('applyServerStateToLocal: skipped coupons overwrite (local is newer)');
      }
    }

    // render 用に最新の配列を取得して renderRestaurants を呼ぶ
    // renderRestaurants を引数ベースに修正しているため、配列を渡す
    const restaurantArray = JSON.parse(localStorage.getItem(restaurantKey) || '[]');
    try {
      renderRestaurants(restaurantArray);
      console.log('applyServerStateToLocal: renderRestaurants called');
    } catch (e) {
      console.error('applyServerStateToLocal: renderRestaurants error', e);
    }

    // UI の gacha 状態も更新
    try { updateStatusArea && updateStatusArea(); } catch (e) {}
  } catch (err) {
    console.error('applyServerStateToLocal: unexpected error', err);
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


