// DOM要素の取得
const gachaButton = document.getElementById('gacha-button');
const loopVideo = document.getElementById("loop-video");
const loopContainer = document.getElementById("background-loop-video");

const userId = localStorage.getItem("userId");
const gachaKey = `gachaState_${userId}`;

if (!localStorage.getItem(gachaKey)) {
  const gachaState = {
    remaining: 10,
    drawnStoreIds: [],
    prizePool: ["normal","normal","normal","normal","normal","normal","normal","rare","rare"]
  };
  localStorage.setItem(gachaKey, JSON.stringify(gachaState));
  updateStatusArea(); // ← ここで即反映
}

const baseRestaurantData = [
  {
    baseId: "ramen001",
    name: "ラーメン一番",
    genre: "ラーメン",
    town: "知多市新舞子",
    images: ["images/ramen1_1.jpg", "images/ramen1_2.jpg", "images/ramen1_3.jpg"],
    hours: "11:00〜22:00",
    mapUrl: "https://maps.google.com/?q=ラーメン一番",
    videoUrl: "videos/ramen1.mp4",
    hpUrl: "https://ramen1.example.com",
    unlocked: false,
    couponUsed: false,
    coupons: {
      normal: { discount: 200, conditions: ["1000円以上のご注文", "店内飲食限定"], expiry: "2025/12/31" },
      rare: { discount: 500, conditions: ["1500円以上のご注文", "店内飲食限定"], expiry: "2025/12/31" },
      "last-one": { discount: 1000, conditions: ["2000円以上のご注文", "店内飲食限定"], expiry: "2025/12/31" }
    }
  },
  {
    baseId: "yakiniku001",
    name: "焼肉キング",
    genre: "焼肉",
    town: "知多市岡田",
    images: ["images/yakiniku1_1.jpg", "images/yakiniku1_2.jpg", "images/yakiniku1_3.jpg"],
    hours: "17:00〜23:00",
    mapUrl: "https://maps.google.com/?q=焼肉キング",
    videoUrl: "videos/yakiniku1.mp4",
    hpUrl: "",
    unlocked: false,
    couponUsed: false,
    coupons: {
      normal: { discount: 300, conditions: ["2000円以上のご注文", "店内飲食限定"], expiry: "2025/12/31" },
      rare: { discount: 600, conditions: ["飲み放題付きコース"], expiry: "2025/12/31" },
      "last-one": { discount: 1200, conditions: ["4名以上のグループ"], expiry: "2025/12/31" }
    }
  },
  {
    baseId: "sushi001",
    name: "寿司太郎",
    genre: "寿司",
    town: "知多市旭",
    images: ["images/sushi1_1.jpg", "images/sushi1_2.jpg", "images/sushi1_3.jpg"],
    hours: "10:00〜21:00",
    mapUrl: "https://maps.google.com/?q=寿司太郎",
    videoUrl: "videos/sushi1.mp4",
    hpUrl: "",
    unlocked: false,
    couponUsed: false,
    coupons: {
      normal: { discount: 250, conditions: ["ランチ限定", "店内飲食限定"], expiry: "2025/12/31" },
      rare: { discount: 700, conditions: ["握りセット注文"], expiry: "2025/12/31" },
      "last-one": { discount: 1500, conditions: ["特上コース限定"], expiry: "2025/12/31" }
    }
  },
  {
    baseId: "cafe001",
    name: "カフェ・ド・ミント",
    genre: "カフェ",
    town: "知多市八幡",
    images: ["images/cafe1_1.jpg", "images/cafe1_2.jpg", "images/cafe1_3.jpg"],
    hours: "9:00〜18:00",
    mapUrl: "https://maps.google.com/?q=カフェ・ド・ミント",
    videoUrl: "videos/cafe1.mp4",
    hpUrl: "https://cafemint.example.com",
    unlocked: false,
    couponUsed: false,
    coupons: {
      normal: { discount: 150, conditions: ["ドリンク注文必須", "店内飲食限定"], expiry: "2025/12/31" },
      rare: { discount: 400, conditions: ["ランチセット注文"], expiry: "2025/12/31" },
      "last-one": { discount: 800, conditions: ["ペア来店限定"], expiry: "2025/12/31" }
    }
  },
  {
    baseId: "bakery001",
    name: "パン工房こむぎ",
    genre: "ベーカリー",
    town: "知多市岡田",
    images: ["images/bakery1_1.jpg", "images/bakery1_2.jpg", "images/bakery1_3.jpg"],
    hours: "7:00〜17:00",
    mapUrl: "https://maps.google.com/?q=パン工房こむぎ",
    videoUrl: "videos/bakery1.mp4",
    hpUrl: "",
    unlocked: false,
    couponUsed: false,
    coupons: {
      normal: { discount: 100, conditions: ["パン3個以上購入", "店内飲食限定"], expiry: "2025/12/31" },
      rare: { discount: 300, conditions: ["セットメニュー購入"], expiry: "2025/12/31" },
      "last-one": { discount: 600, conditions: ["ファミリーセット限定"], expiry: "2025/12/31" }
    }
  },
  {
    baseId: "italian001",
    name: "イタリアン・マリーナ",
    genre: "イタリアン",
    town: "知多市南浜",
    images: ["images/italian1_1.jpg", "images/italian1_2.jpg", "images/italian1_3.jpg"],
    hours: "11:30〜22:00",
    mapUrl: "https://maps.google.com/?q=イタリアン・マリーナ",
    videoUrl: "videos/italian1.mp4",
    hpUrl: "https://marina.example.com",
    unlocked: false,
    couponUsed: false,
    coupons: {
      normal: { discount: 200, conditions: ["パスタ注文必須", "店内飲食限定"], expiry: "2025/12/31" },
      rare: { discount: 500, conditions: ["前菜＋パスタセット"], expiry: "2025/12/31" },
      "last-one": { discount: 1000, conditions: ["フルコース注文"], expiry: "2025/12/31" }
    }
  },
  {
    baseId: "bar001",
    name: "バー・ナイトオウル",
    genre: "バー",
    town: "知多市寺本",
    images: ["images/bar1_1.jpg", "images/bar1_2.jpg", "images/bar1_3.jpg"],
    hours: "18:00〜2:00",
    mapUrl: "https://maps.google.com/?q=バー・ナイトオウル",
    videoUrl: "videos/bar1.mp4",
    hpUrl: "",
    unlocked: false,
    couponUsed: false,
    coupons: {
      normal: { discount: 180, conditions: ["ドリンク2杯以上注文", "店内飲食限定"], expiry: "2025/12/31" },
      rare: { discount: 450, conditions: ["カクテルセット注文"], expiry: "2025/12/31" },
      "last-one": { discount: 900, conditions: ["店長おすすめセット"], expiry: "2025/12/31" }
    }
  },
  {
    baseId: "okonomiyaki001",
    name: "お好み焼き まるまる",
    genre: "お好み焼き",
    town: "知多市新知",
    images: ["images/okonomiyaki1_1.jpg", "images/okonomiyaki1_2.jpg", "images/okonomiyaki1_3.jpg"],
    hours: "11:00〜20:00",
    mapUrl: "https://maps.google.com/?q=お好み焼き まるまる",
    videoUrl: "videos/okonomiyaki1.mp4",
    hpUrl: "",
    unlocked: false,
    couponUsed: false,
    coupons: {
      normal: { discount: 200, conditions: ["1000円以上注文", "店内飲食限定"], expiry: "2025/12/31" },
      rare: { discount: 500, conditions: ["鉄板焼きセットを注文"], expiry: "2025/12/31" },
      "last-one": { discount: 1000, conditions: ["グループ来店限定"], expiry: "2025/12/31" }
    }
  },
  {
    baseId: "teishoku001",
    name: "定食屋 ふくふく",
    genre: "定食",
    town: "知多市西巽が丘",
    images: ["images/teishoku1_1.jpg", "images/teishoku1_2.jpg", "images/teishoku1_3.jpg"],
    hours: "10:30〜20:30",
    mapUrl: "https://maps.google.com/?q=定食屋 ふくふく",
    videoUrl: "videos/teishoku1.mp4",
    hpUrl: "",
    unlocked: false,
    couponUsed: false,
    coupons: {
      normal: { discount: 150, conditions: ["定食注文必須", "店内飲食限定"], expiry: "2025/12/31" },
      rare: { discount: 400, conditions: ["日替わり定食注文"], expiry: "2025/12/31" },
      "last-one": { discount: 800, conditions: ["ご飯大盛り無料付き"], expiry: "2025/12/31" }
    }
  },
  {
    baseId: "tonkatsu001",
    name: "とんかつ さくら亭",
    genre: "とんかつ",
    town: "知多市佐布里",
    images: ["images/tonkatsu1_1.jpg", "images/tonkatsu1_2.jpg", "images/tonkatsu1_3.jpg"],
    hours: "11:00〜21:00",
    mapUrl: "https://maps.google.com/?q=とんかつ さくら亭",
    videoUrl: "videos/tonkatsu1.mp4",
    hpUrl: "https://sakura.example.com",
    unlocked: false,
    couponUsed: false,
    coupons: {
      normal: { discount: 200, conditions: ["とんかつ定食注文", "店内飲食限定"], expiry: "2025/12/31" },
      rare: { discount: 500, conditions: ["ロースかつ＋ドリンクセット"], expiry: "2025/12/31" },
      "last-one": { discount: 1000, conditions: ["特選ヒレかつコース限定"], expiry: "2025/12/31" }
    }
  }
];

const prizeTypes = ["normal", "rare", "last-one"];

window.initialRestaurantData = baseRestaurantData.flatMap(base => {
  return prizeTypes.map((type, index) => ({
    storeId: `${base.baseId}-${index + 1}`,         // 例：ramen001-1
    baseId: base.baseId,                             // ✅ 明示的に追加
    prizeType: type,                                 // normal / rare / last-one
    name: base.name,
    genre: base.genre,
    town: base.town,
    images: base.images,
    hours: base.hours,
    mapUrl: base.mapUrl,
    videoUrl: base.videoUrl,
    hpUrl: base.hpUrl,
    unlocked: false,
    couponUsed: false,
    coupon: base.coupons[type]
  }));
});


const currentData = JSON.parse(localStorage.getItem("restaurantData"));
if (!Array.isArray(currentData) || currentData.length === 0) {
  localStorage.setItem("restaurantData", JSON.stringify(window.initialRestaurantData));
}

window.initializeRestaurantData = function () {
  const currentData = JSON.parse(localStorage.getItem("restaurantData"));
  if (!Array.isArray(currentData) || currentData.length === 0) {
    localStorage.setItem("restaurantData", JSON.stringify(window.initialRestaurantData));
  }
};

function updateCouponSummary(amount) {
  const summary = document.getElementById("coupon-summary");
  summary.classList.remove("silver", "gold", "rainbow");

  if (amount >= 2000) {
    summary.classList.add("rainbow");
  } else if (amount >= 1000) {
    summary.classList.add("gold");
  } else {
    summary.classList.add("silver");
  }

  document.getElementById("total-amount").textContent = `${amount}円`;
}

// 初期表示（PoC用）
updateCouponSummary(0);

// １．演出制御の全体構成


// ２．ガチャ演出の開始
function startGachaSequence() {
  const popup = document.getElementById("gacha-popup");
  const gachaVideo = document.getElementById("gacha-roll-video");
  const prizeImage = document.getElementById("prize-image");
  const prVideoContainer = document.getElementById("pr-video-fullscreen");
  const prVideo = document.getElementById("pr-video");
  const couponPopup = document.getElementById("coupon-popup");
  const backButton = document.getElementById("back-button");

  // 初期化
  popup.classList.remove("hidden");
  prizeImage.classList.add("hidden");
  couponPopup.classList.add("hidden");
  backButton.classList.add("hidden");
  prVideoContainer.classList.add("hidden");

  // 🎥 ラストワン賞なら別動画を再生
  const isLastOne = isLastOneReady();
  gachaVideo.src = isLastOne ? "videos/gacha2.mp4" : "videos/gacha.mp4";
  gachaVideo.load();
  gachaVideo.currentTime = 0;
  gachaVideo.play();

  // 6秒後：賞種抽選 → 店舗抽選 → 演出開始
  setTimeout(() => {
    const prizeType = drawPrizeType();
    const store = drawStore(prizeType); // ✅ 引数付きで1回だけ抽選

    console.log("抽選された賞種:", prizeType);
    console.log("選ばれた店舗:", store);

    if (!store) {
      alert("抽選対象の店舗がありません。");
      return;
    }

    if (prizeType === "last-one") {
      localStorage.setItem("gachaCompleted", "true");
    } else {
      localStorage.setItem("gachaCompleted", "false");
    }

    const prizeSrcMap = {
      normal: "images/prize_normal.png",
      rare: "images/prize_rare.png",
      "last-one": "images/prize_lastone.png"
    };
    const prizeSrc = prizeSrcMap[prizeType] || "images/prize_normal.png";

    prizeImage.src = prizeSrc;
    prizeImage.classList.remove("hidden");
    prizeImage.classList.add("prize-image", "pop-in");

    const loopSrcMap = {
      normal: "videos/gacha_normal.mp4",
      rare: "videos/gacha_rare.mp4",
      "last-one": "videos/gacha_lastone.mp4"
    };
    loopVideo.src = loopSrcMap[prizeType] || "videos/gacha_normal.mp4";
    loopVideo.load();
    loopContainer.classList.remove("hidden");

    // 2秒後：PR動画開始
    setTimeout(() => {
      store.prizeType = prizeType;
      store.unlocked = true;
      updateRestaurantData(store);
      addCoupon(store, prizeType);

      if (store.videoUrl) {
        prVideo.src = store.videoUrl;
        prVideo.muted = false;
        prVideo.volume = 1.0;
        prVideoContainer.classList.remove("hidden");
        prVideo.play();

        sendVideoLog({
          userId: localStorage.getItem("userId"),
          storeId: store.storeId,
          storeName: store.name,
          prizeType: store.prizeType,
          salonId: getSalonId(), 
          eventSource: "gacha"   // ← 追加：ガチャ起点であることを明示
        });

        prVideo.onended = () => {
          prVideoContainer.classList.add("hidden");
          showCouponCard(store, prizeType);
          updateStatusArea();
        };
      } else {
        console.warn("動画URLが未設定の店舗です");
        showCouponCard(store, prizeType);
        updateStatusArea();
      }
    }, 3000);
  }, 4500);
}

function addCoupon(store, prizeType) {
const userId = localStorage.getItem("userId");
const key = `myCoupons_${userId}`;
const coupons = JSON.parse(localStorage.getItem(key)) || [];

  // ✅ storeId がすでに存在するかチェック
  const alreadyExists = coupons.some(c => c.storeId === store.storeId);
  if (alreadyExists) {
    console.warn("すでにこの店舗のクーポンを所持しています:", store.storeId);
    return;
  }

  // ✅ store.conditions が存在しない場合は追加しない
  if (!store.conditions || !Array.isArray(store.conditions)) {
    console.warn("店舗条件が未定義のため、クーポンを追加しません:", store.storeId);
    return;
  }

  const newCoupon = {
    storeId: store.storeId,
    storeName: store.name,
    discount: store.coupon.discount,
    conditions: store.coupon.conditions,
    expiry: store.coupon.expiry,
    type: prizeType,
    used: false
  };

  coupons.push(newCoupon);
  localStorage.setItem(key, JSON.stringify(coupons));
}

// ３．重賞の抽選
function drawPrizeType() {
  const userId = localStorage.getItem("userId");
  const gachaKey = `gachaState_${userId}`;
  const state = JSON.parse(localStorage.getItem(gachaKey));
  const pool = state.prizePool;

  if (!pool || pool.length === 0) {
    if (state.remaining > 0) {
      state.remaining--;
      localStorage.setItem(gachaKey, JSON.stringify(state));
      return "last-one";
    } else {
      console.warn("ガチャはすでに終了しています");
      return null;
    }
  }

  const index = Math.floor(Math.random() * pool.length);
  const prize = pool.splice(index, 1)[0];
  state.prizePool = pool;
  state.remaining = (state.remaining || 10) - 1;
  localStorage.setItem(gachaKey, JSON.stringify(state));
  return prize;
}

// ４．店舗の抽選（未排出からランダム）
function drawStore(prizeType) {
  const userId = localStorage.getItem("userId");
  const gachaKey = `gachaState_${userId}`;
  const restaurantKey = `restaurantData_${userId}`;

  const allStores = JSON.parse(localStorage.getItem(restaurantKey)) || [];
  const state = JSON.parse(localStorage.getItem(gachaKey)) || { drawnStoreIds: [] };

  // 🎯 該当賞種かつ未排出の店舗だけ抽出
  const drawnBaseIds = state.drawnStoreIds.map(id => id.split("-")[0]);

  const remainingStores = allStores.filter(store =>
    store.prizeType === prizeType &&
    !drawnBaseIds.includes(store.baseId)
  );

  if (remainingStores.length === 0) {
    console.warn(`抽選対象の店舗がありません（賞種: ${prizeType}）`);
    return null;
  }

  // 🎯 ラストワン賞なら最初の店舗、それ以外はランダム抽選
  const selectedStore = prizeType === "last-one"
    ? remainingStores[0]
    : remainingStores[Math.floor(Math.random() * remainingStores.length)];

  // 🎯 抽選済みIDとして記録
  state.drawnStoreIds.push(selectedStore.storeId);
  localStorage.setItem(gachaKey, JSON.stringify(state));

  console.log("選ばれた店舗:", selectedStore);
  return selectedStore;
}

function updateStatusArea() {
  const userId = localStorage.getItem("userId");
  const gachaKey = `gachaState_${userId}`;
  const state = JSON.parse(localStorage.getItem(gachaKey)) || {};
  const prizePool = state.prizePool || [];

  const normalCount = prizePool.filter(p => p === "normal").length;
  const rareCount = prizePool.filter(p => p === "rare").length;

  const remainingCountEl = document.getElementById("remaining-count");
  const normalLeftEl = document.getElementById("normal-left");
  const rareLeftEl = document.getElementById("rare-left");
  const normalTotalEl = document.getElementById("normal-total");
  const rareTotalEl = document.getElementById("rare-total");

  if (remainingCountEl) remainingCountEl.textContent = `${prizePool.length}回`;
  if (normalLeftEl) normalLeftEl.textContent = normalCount;
  if (rareLeftEl) rareLeftEl.textContent = rareCount;
  if (normalTotalEl) normalTotalEl.textContent = "7";
  if (rareTotalEl) rareTotalEl.textContent = "2";
}

function isLastOneReady() {
  const userId = localStorage.getItem("userId");
  const gachaKey = `gachaState_${userId}`;
  const state = JSON.parse(localStorage.getItem(gachaKey));
  return state.prizePool.length === 0;
}

function setupBackButton() {
  const backButton = document.getElementById("back-button");
  if (!backButton) {
    console.warn("戻るボタンが見つかりません");
    return;
  }

  backButton.onclick = () => {
    const gachaPopup = document.getElementById("gacha-popup");
    const loopVideo = document.getElementById("loop-video");
    const loopContainer = document.getElementById("background-loop-video");

    gachaPopup.classList.add("hidden");
    loopVideo.pause();
    loopVideo.currentTime = 0;
    loopContainer.classList.add("hidden");

    updateGachaButtonState();
  };
}

// ６．クーポン追加＋店舗アンロック
function showCouponCard(store, prizeType) {
  const couponPopup = document.getElementById("coupon-popup");
  const backButton = document.getElementById("back-button");
  const coupon = store.coupon;

  document.getElementById("coupon-store-name").textContent = store.name;
  document.getElementById("coupon-discount").textContent = `${coupon.discount}円オフ`;
  document.getElementById("coupon-conditions").innerHTML = coupon.conditions.map(c => `<li>${c}</li>`).join("");
  document.getElementById("coupon-expiry").textContent = `有効期限：${coupon.expiry}`;

  couponPopup.classList.remove("hidden");

  const userId = localStorage.getItem("userId");
  const key = `myCoupons_${userId}`;
  const coupons = JSON.parse(localStorage.getItem(key)) || [];

  coupons.push({
    storeId: store.storeId,
    storeName: store.name,
    discount: coupon.discount,
    conditions: coupon.conditions,
    expiry: coupon.expiry,
    type: prizeType,
    used: false
  });
  localStorage.setItem(key, JSON.stringify(coupons));

  backButton.classList.remove("hidden");
  setupBackButton(); // ← これを追加
  const totalAmount = coupons.reduce((sum, c) => sum + c.discount, 0);
  updateCouponSummary(totalAmount);
}

// ７．戻るボタン→ガチャ画面復帰
function updateGachaButtonState() {
  const userId = localStorage.getItem("userId");
  const gachaKey = `gachaState_${userId}`;
  const restaurantKey = `restaurantData_${userId}`;

  const gachaButtonImage = document.getElementById("gacha-button-image");
  const state = JSON.parse(localStorage.getItem(gachaKey));
  const allStores = JSON.parse(localStorage.getItem(restaurantKey));

  gachaButtonImage.classList.remove("pulse", "rainbow", "complete");
  gachaButtonImage.onclick = null;

  if (state.remaining === 0) {
    gachaButtonImage.src = "images/gacha-end-button.png";
    gachaButtonImage.classList.add("complete");
    gachaButtonImage.onclick = () => {};
  } else if (state.prizePool.length === 0) {
    gachaButtonImage.src = "images/gacha-lastone-button.png";
    gachaButtonImage.classList.add("zoom", "rainbow");
    gachaButtonImage.onclick = () => startGachaSequence();
  } else {
    gachaButtonImage.src = "images/gacha-button.png";
    gachaButtonImage.classList.add("zoom");
    gachaButtonImage.onclick = () => startGachaSequence();
  }
}

function updateRestaurantData(updatedStore) {
  const userId = localStorage.getItem("userId");
  const key = `restaurantData_${userId}`;
  const currentData = JSON.parse(localStorage.getItem(key)) || [];

  const newData = currentData.map(store => {
    if (store.storeId === updatedStore.storeId) {
      return { ...store, ...updatedStore };
    }

    // ✅ baseId一致かつ prizeTypeが normal → 表示対象なのでアンロック
    if (
      store.baseId === updatedStore.baseId &&
      store.prizeType === "normal" &&
      !store.unlocked
    ) {
      return { ...store, unlocked: true };
    }

    return store;
  });

  localStorage.setItem(key, JSON.stringify(newData));
}

// その他の関数のあとに追加
function getSalonId() {
  return localStorage.getItem("salonId") || "salon000"; // fallback付き
}

document.addEventListener("DOMContentLoaded", () => {
  const userId = localStorage.getItem("userId");
  const gachaKey = `gachaState_${userId}`;
  const restaurantKey = `restaurantData_${userId}`;
  const couponKey = `myCoupons_${userId}`;

  // ✅ gachaState の初期化（必要なら）
  if (!localStorage.getItem(gachaKey)) {
    const gachaState = {
      remaining: 10,
      drawnStoreIds: [],
      prizePool: ["normal","normal","normal","normal","normal","normal","normal","rare","rare"]
    };
    localStorage.setItem(gachaKey, JSON.stringify(gachaState));
  }

  // ✅ restaurantData の初期化（必要なら）
  if (!localStorage.getItem(restaurantKey)) {
    localStorage.setItem(restaurantKey, JSON.stringify(window.initialRestaurantData));
  }

  // ✅ クーポン合計金額の復元
  const coupons = JSON.parse(localStorage.getItem(couponKey)) || [];
  const totalAmount = coupons.reduce((sum, c) => sum + c.discount, 0);
  updateCouponSummary(totalAmount);

  // ✅ 表示更新
  updateStatusArea();
  updateGachaButtonState();
});

console.log("📦 restaurantData:", JSON.parse(localStorage.getItem(`restaurantData_${localStorage.getItem("userId")}`)));
console.log("🎰 gachaState:", JSON.parse(localStorage.getItem(`gachaState_${localStorage.getItem("userId")}`)));
console.log(JSON.parse(localStorage.getItem(`restaurantData_${localStorage.getItem("userId")}`))); // ← これだけ残す

window.initializeRestaurantData = function () {
  const userId = localStorage.getItem("userId");
  const restaurantKey = `restaurantData_${userId}`;
  const currentData = JSON.parse(localStorage.getItem(restaurantKey));

  if (!Array.isArray(currentData) || currentData.length === 0) {
    localStorage.setItem(restaurantKey, JSON.stringify(window.initialRestaurantData));
  }
};

function sendVideoLog({ userId, storeId, storeName, prizeType, salonId }) {
  const gachaCompleted = localStorage.getItem("gachaCompleted") === "true";

  const payload = {
    timestamp: new Date().toISOString(),
    userId,
    storeId,
    storeName,
    salonId,
    prizeType,
    eventType: "viewed",
    gachaCompleted
  };

  const url = "https://script.google.com/macros/s/AKfycbyzv4PcZ0fKPO3wN7RkbAeW8-GUeJYjDD6gcTfhdIo_P4Vyl1VEa2A4HdTmn_HH423l/exec";

  // application/x-www-form-urlencoded で送る（プレフライト回避）
  return fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8"
    },
    body: "data=" + encodeURIComponent(JSON.stringify(payload))
  })
  .then(response => {
    // レスポンスが JSON で返ってくればパースしてログ出力
    return response.text().then(text => {
      try { return JSON.parse(text); } catch(e) { return { raw: text }; }
    });
  })
  .then(json => console.log("動画視聴ログ送信結果:", json))
  .catch(err => console.error("動画視聴ログ送信エラー:", err));
}
