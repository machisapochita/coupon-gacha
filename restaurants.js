let restaurantData = JSON.parse(localStorage.getItem("restaurantData"));
if (!Array.isArray(restaurantData)) {
  console.warn("店舗データが配列ではありません");
  restaurantData = window.initialRestaurantData || []; // fallback（念のため）
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
  const userId = localStorage.getItem("userId");
  const key = `restaurantData_${userId}`;
  const container = document.getElementById("restaurant-container");
  container.innerHTML = "";

  const data = JSON.parse(localStorage.getItem(key)) || [];

  // 🎯 baseIdごとに最初の1件だけ抽出（例：ramen001）
  const uniqueStores = [];
  const seenBaseIds = new Set();

  for (const store of data) {
    const baseId = store.baseId || store.storeId.split("-")[0];
    if (!seenBaseIds.has(baseId)) {
      seenBaseIds.add(baseId);
      uniqueStores.push(store);
    }
  }

  uniqueStores.forEach(store => {
    console.log("カード生成中:", store.storeId);

    const card = document.createElement("div");
    card.className = "restaurant-card";
    card.dataset.storeId = store.storeId;

    if (store.unlocked) {
      // ✅ アンロックされた店舗 → 情報表示
      card.classList.add("unlocked");
      card.innerHTML = `
        <h3 class="store-name">${store.name}</h3>
        <div class="card-content">
          <img src="${store.images[0]}" alt="店舗写真" class="store-image" />
          <div class="store-details">
            <p class="store-genre">${store.genre}</p>
            <p class="store-town">${store.town}</p>
            <p class="coupon-status ${store.couponUsed ? "used" : "unused"}">
              ${store.couponUsed ? "クーポン：済" : "クーポン：未"}
            </p>
          </div>
        </div>
      `;
    } else {
      // 🔒 ロックされた店舗 → 非公開表示
      card.classList.add("locked");
      card.innerHTML = `
        <h3 class="store-name">ガチャで開放</h3>
        <div class="card-content">
          <img src="images/secret_image.png" alt="非公開画像" class="store-image locked-image" />
          <div class="store-details">
            <p class="store-genre">？？？</p>
            <p class="store-town">？？？</p>
            <p class="coupon-status unused">クーポン：未</p>
          </div>
          <div class="lock-overlay">
            <img src="images/rock_chain.png" alt="ロック中" class="lock-image" />
          </div>
        </div>
      `;
    }

    // ✅ どちらの状態でもクリック可能にしてモーダル表示
    card.addEventListener("click", () => {
      const storeId = card.dataset.storeId;
      const targetStore = data.find(s => s.storeId === storeId);
      if (targetStore) {
        openModal(targetStore);
      } else {
        console.warn("店舗データが見つかりません:", storeId);
      }
    });

    container.appendChild(card);
  });
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
      if (res && res.status === "OK" && res.found && res.state) {
        // applyServerStateToLocal は gacha.js 側で定義されている前提
        try {
          window.applyServerStateToLocal(res.state ? { found: true, state: res.state } : res, userId);
          console.info("restaurants.js: server state applied for", userId);
        } catch (e) {
          // 互換性が合わない場合に備えて直接保存も行っておく
          if (res.state) {
            if (res.state.restaurantData) localStorage.setItem(`restaurantData_${userId}`, JSON.stringify(res.state.restaurantData));
            if (res.state.coupons) localStorage.setItem(`myCoupons_${userId}`, JSON.stringify(res.state.coupons));
            if (res.state.gachaState) localStorage.setItem(`gachaState_${userId}`, JSON.stringify(res.state.gachaState));
            console.info("restaurants.js: fallback applied server state");
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


