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

// --- 追加: ページ初期化（UI更新をここで一元化） ---
function initGachaUI() {
  try {
    // ensure per-user restaurant data exists
    try { window.initializeRestaurantData && window.initializeRestaurantData(); } catch(e){}

    // status area (残回数・賞種カウント) を必ず更新
    try { updateStatusArea(); } catch(e) { console.warn("updateStatusArea failed:", e); }

    // gacha ボタンの状態／クリックハンドラを設定
    try { updateGachaButtonState(); } catch(e) { console.warn("updateGachaButtonState failed:", e); }

    // coupon 合計等をローカルから復元して表示
    try {
      const coupons = JSON.parse(localStorage.getItem(`myCoupons_${userId}`) || "[]");
      const totalAmount = coupons.reduce((sum, c) => sum + (c.discount || 0), 0);
      updateCouponSummary && updateCouponSummary(totalAmount);
    } catch(e){ /* ignore */ }
  } catch (err) {
    console.error("initGachaUI error:", err);
  }
}

// DOMContentLoaded 時に initGachaUI を確実に呼ぶ（既存の safeGachaInit でも呼ばれる）
document.addEventListener("DOMContentLoaded", async () => {
  try {
    // initGachaUI が非同期処理を含む可能性がある場合に await しても安全
    await (typeof initGachaUI === "function" ? initGachaUI() : Promise.resolve());
  } catch (e) {
    console.warn("DOMContentLoaded initGachaUI failed:", e);
  }
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
  // ループ背景用 video（coupon-popup 内で再生）
  const loopVideo = document.getElementById("loop-video");
  const loopContainer = document.getElementById("background-loop-video");

  // 初期 UI セット
  popup.classList.remove("hidden");
  prizeImage.classList.add("hidden");
  couponPopup.classList.add("hidden");
  backButton.classList.add("hidden");
  prVideoContainer.classList.add("hidden");
  if (loopContainer) loopContainer.classList.add("hidden");

  // 1) 抽選を先に行う（賞種と店舗）
  const prizeType = drawPrizeType();
  const store = drawStore(prizeType);

  console.log("抽選された賞種:", prizeType);
  console.log("選ばれた店舗:", store);

  if (!store) {
    alert("抽選対象の店舗がありません。");
    popup.classList.add("hidden");
    return;
  }

  // gachaCompleted フラグ
  if (prizeType === "last-one") {
    localStorage.setItem("gachaCompleted", "true");
  } else {
    localStorage.setItem("gachaCompleted", "false");
  }

  // pause stateSync to avoid intermediate duplicate saveState posts
  try { stateSync.pause(); } catch(e){}

  // 当選店舗をアンロックしてクーポンを用意（PR 再生前に状態を更新）
  store.prizeType = prizeType;
  store.unlocked = true;
  updateRestaurantData(store);
  addCoupon(store, prizeType);

  // ここでガチャ実行ログを送る（エラーがあっても動作継続）
  try {
    const userId = localStorage.getItem("userId") || "unknown";
    const salonId = getSalonId() || "unknown";
    const payload = {
      eventType: "gacha",
      userId: userId,
      storeId: store.storeId || store.id || "unknown",
      storeName: store.name || "unknown",
      salonId: salonId,
      prizeType: prizeType,
      gachaCompleted: (prizeType === "last-one")
    };
    // 既存のログ送信ユーティリティがあればそれを呼ぶ
    if (typeof sendGachaLog === "function") {
      sendGachaLog(payload).catch(err => console.warn("gacha log send failed:", err));
    } else {
      const url = (typeof LOG_URL !== "undefined") ? LOG_URL : (window.LOG_URL || "");
      if (url) {
        fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8" },
          body: "data=" + encodeURIComponent(JSON.stringify(payload))
        }).catch(err => console.warn("gacha log send failed:", err));
      }
    }
  } catch (e) {
    console.warn("gacha log prepare failed:", e);
  }

  // 最後に一度だけ state を送信して resume
  try {
    const uid = localStorage.getItem("userId");
    if (uid) {
      const snapshot = {
        coupons: JSON.parse(localStorage.getItem(`myCoupons_${uid}`) || "[]"),
        restaurantData: JSON.parse(localStorage.getItem(`restaurantData_${uid}`) || "[]"),
        gachaState: JSON.parse(localStorage.getItem(`gachaState_${uid}`) || "{}")
      };
      // updatedAt を付けて投げる（server 側でも上書き対策に利用）
      snapshot.updatedAt = Date.now();
      saveGachaStateToServer(snapshot).then(r => console.info("saved snapshot", r)).catch(e => console.warn("save failed", e));
      stateSync.resume();
      // flushNow を使えば即時送信を待てる（必要なら then で処理）
      stateSync.requestSave(snapshot);
      stateSync.flushNow().catch(e => console.warn("flushNow error:", e));
    } else {
      stateSync.resume();
    }
  } catch (e) {
    stateSync.resume();
  }

  // --- ここでガチャ実行ログを必ず送る（Apps Script の doPost が受け取る形式） ---
  try {
    const uid = localStorage.getItem("userId") || "未設定";
    const salonId = getSalonId(); // return 既存の salonId or fallback
    console.log("sending gacha viewed log", { userId: uid, storeId: store.storeId, storeName: store.name, prizeType, salonId });
    // sendVideoLog は fetch を return するので Promise を受け取れる
    sendVideoLog({ userId: uid, storeId: store.storeId, storeName: store.name, prizeType, salonId })
      .then(res => console.log("sendVideoLog ok:", res))
      .catch(err => console.error("sendVideoLog error:", err));
  } catch (e) {
    console.warn("gacha log send failed:", e);
  }
  // --- ログ送信ここまで ---
  
  // 2) 賞種に応じたガチャ演出動画を再生
  const gachaSrcMap = {
    normal: "videos/gacha-normal.mp4",
    rare: "videos/gacha-rare.mp4",
    "last-one": "videos/gacha-last-one.mp4"
  };
  const gachaSrc = gachaSrcMap[prizeType] || gachaSrcMap.normal;

  // 再生が終わったら PR を再生するシーケンスを設定
  const onGachaEnded = async () => {
    // 再生終了時 / スキップ時のクリーンアップ
    removeSkipButton();
    gachaVideo.removeEventListener("ended", onGachaEnded);

    // 3) 当選店舗の PR 動画を再生
    if (store.videoUrl) {
      try {
        // 事前読み込み（可能な限り）してから再生
        await preloadVideo(prVideo, store.videoUrl, { preload: "auto", timeout: 7000 });
      } catch (e) {
        console.warn("PR video preload failed:", e);
      }

      prVideoContainer.classList.remove("hidden");
      prVideo.currentTime = 0;
      // PR は音声ありで再生を試みる
      try { prVideo.muted = false; prVideo.volume = 1; } catch(e) {}

      const onPrEnded = () => {
        prVideo.removeEventListener("ended", onPrEnded);
        prVideoContainer.classList.add("hidden");

        // 4) PR 終了後に coupon-popup を開く & 賞種に応じたループ動画を再生
        openCouponPopupWithLoop(prizeType, store);
      };
      prVideo.addEventListener("ended", onPrEnded);

      try {
        const prRes = await tryPlayWithSoundFallback(prVideo);
        if (prRes && prRes.muted) {
          console.info("prVideo playing muted (user gesture required to enable audio)");
        }
      } catch (err) {
        console.warn("prVideo play failed entirely:", err);
        // 再生できない場合は直ちにクーポン表示に移行
        prVideoContainer.classList.add("hidden");
        openCouponPopupWithLoop(prizeType, store);
      }
    } else {
      console.warn("動画URLが未設定の店舗です");
      openCouponPopupWithLoop(prizeType, store);
    }
  };

  // gacha video を preload -> play
  (async () => {
    try {
      await preloadVideo(gachaVideo, gachaSrc, { preload: "metadata", timeout: 4000 });
    } catch (e) {
      console.warn("gacha video preload warning:", e);
    }
    gachaVideo.currentTime = 0;
    gachaVideo.addEventListener("ended", onGachaEnded);

    // スキップフラグ（多重実行防止）
    let gachaSkipped = false;

    // スキップボタンを表示してクリックで onGachaEnded に移行する
    const skipBtn = createSkipButton();
    if (skipBtn) {
      const onSkip = (ev) => {
        ev && ev.preventDefault();
        if (gachaSkipped) return;
        gachaSkipped = true;
        removeSkipButton();
        try { gachaVideo.pause(); } catch(e) {}
        try { /* ジャンプして ended を待たずに処理 */ onGachaEnded(); } catch(e) { console.warn(e); }
      };
      skipBtn.addEventListener("click", onSkip, { once: true });
    }

    try {
      const res = await tryPlayWithSoundFallback(gachaVideo);
      if (res && res.muted) {
        console.info("gachaVideo playing muted (user gesture required to enable audio)");
      }
      // 再生が始まったらそのままスキップボタンは有効（表示済み）
    } catch (err) {
      console.warn("gachaVideo play failed entirely:", err);
      // 再生できない場合は直接 PR に遷移
      removeSkipButton();
      onGachaEnded();
    }
  })();
}

// 補助: 賞種に応じた coupon-popup 表示とループ動画再生
function openCouponPopupWithLoop(prizeType, store) {
  const couponPopup = document.getElementById("coupon-popup");
  const loopVideo = document.getElementById("loop-video");
  const loopContainer = document.getElementById("background-loop-video");
  const prizeImage = document.getElementById("prize-image");

  // prize-image は表示しない（仕様変更）
  if (prizeImage) prizeImage.classList.add("hidden");

  // クーポン内容表示
  document.getElementById("coupon-store-name").textContent = store.name;
  const coupon = store.coupon || { discount: 0, conditions: [], expiry: "" };
  document.getElementById("coupon-discount").textContent = `${coupon.discount}円オフ`;
  document.getElementById("coupon-conditions").innerHTML = (coupon.conditions || []).map(c => `<li>${c}</li>`).join("");
  document.getElementById("coupon-expiry").textContent = `有効期限：${coupon.expiry}`;

  // 賞種に応じたループソース
  const loopSrcMap = {
    normal: "videos/coupon-normal.mp4",
    rare: "videos/coupon-rare.mp4",
    "last-one": "videos/coupon-last-one.mp4"
  };
  const loopSrc = loopSrcMap[prizeType] || loopSrcMap.normal;

  // ループ動画を preload -> 再生（ミュートしてループ）
  (async () => {
    if (loopContainer) loopContainer.classList.remove("hidden");
    try {
      await preloadVideo(loopVideo, loopSrc, { preload: "metadata", timeout: 3000 });
    } catch (e) {
      console.warn("loop video preload failed:", e);
    }
    try {
      loopVideo.loop = true;
      loopVideo.muted = true;
      loopVideo.currentTime = 0;
      await loopVideo.play().catch(() => { /* ignore */ });
    } catch (e) {
      console.warn("loopVideo play error:", e);
    }
  })();

  couponPopup.classList.remove("hidden");

  // 戻るボタンの動作を確実に登録しておく
  // （この関数経由で開くケースでは setupBackButton が未登録の可能性があるため）
  try { setupBackButton(); } catch(e) { console.warn("setupBackButton failed:", e); }

  const backButton = document.getElementById("back-button");
  if (backButton) backButton.classList.remove("hidden");
  updateStatusArea();
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

  // store.coupon があることを期待（なければ基本情報を埋める）
  if (!store.coupon) {
    console.warn("store.coupon が未設定のため既定値を使用します:", store.storeId);
    store.coupon = { discount: 0, conditions: [], expiry: "" };
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

  // UI の合計金額を更新（クーポン追加直後に反映）
  try {
    const totalAmount = coupons.reduce((sum, c) => sum + (c.discount || 0), 0);
    updateCouponSummary(totalAmount);
  } catch (e) {
    console.warn("updateCouponSummary failed:", e);
  }

  // サーバへ状態を保存（同期）：必ず呼ぶ
  try {
    const snapshot = {
      coupons: JSON.parse(localStorage.getItem(`myCoupons_${userId}`) || "[]"),
      restaurantData: JSON.parse(localStorage.getItem(`restaurantData_${userId}`) || "[]"),
      gachaState: JSON.parse(localStorage.getItem(`gachaState_${userId}`) || "{}")
    };
    saveGachaStateToServer(snapshot)
      .then(res => console.log("saveGachaStateToServer ok:", res))
      .catch(err => console.warn("saveGachaStateToServer error:", err));
  } catch (e) {
    console.warn("snapshot/save failed:", e);
  }

  // たとえば addCoupon 内のローカル保存直後に追加：
  try {
    const uid = localStorage.getItem("userId");
    if (uid) {
      const snapshot = {
        coupons: JSON.parse(localStorage.getItem(`myCoupons_${uid}`) || "[]"),
        restaurantData: JSON.parse(localStorage.getItem(`restaurantData_${uid}`) || "[]"),
        gachaState: JSON.parse(localStorage.getItem(`gachaState_${uid}`) || "{}")
      };
      // updatedAt は saveGachaStateToServer 内で付与されるが、ここで確実に渡す
      saveGachaStateToServer(snapshot).then(res => {
        console.log("addCoupon: saved server snapshot", res);
      }).catch(err => {
        console.warn("addCoupon: save snapshot failed", err);
      });
    }
  } catch (e) {
    console.warn("addCoupon: snapshot/ save error", e);
  }
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
      // サーバに保存
      try {
        const snapshot = {
          coupons: JSON.parse(localStorage.getItem(`myCoupons_${userId}`) || "[]"),
          restaurantData: JSON.parse(localStorage.getItem(`restaurantData_${userId}`) || "[]"),
          gachaState: JSON.parse(localStorage.getItem(gachaKey) || "{}")
        };
        saveGachaStateToServer(snapshot).catch(e => console.warn("save after drawPrizeType failed:", e));
      } catch (e) { console.warn(e); }
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

  // サーバに保存（重要）
  try {
    const snapshot = {
      coupons: JSON.parse(localStorage.getItem(`myCoupons_${userId}`) || "[]"),
      restaurantData: JSON.parse(localStorage.getItem(`restaurantData_${userId}`) || "[]"),
      gachaState: JSON.parse(localStorage.getItem(gachaKey) || "{}")
    };
    saveGachaStateToServer(snapshot).catch(e => console.warn("save after drawPrizeType failed:", e));
  } catch (e) { console.warn(e); }

  return prize;
}

// ４．店舗の抽選（未排出からランダム）
function drawStore(prizeType) {
  const userId = localStorage.getItem("userId");
  const gachaKey = `gachaState_${userId}`;
  const restaurantKey = `restaurantData_${userId}`;

  // 変更: 直接 localStorage を読むのではなく、汎用ユーティリティ経由で取得する
  // getRestaurantListForUser は legacy キーや global 初期データをフォールバックして返す
  const allStores = getRestaurantListForUser(userId) || [];
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

  // サーバに保存（drawnStoreIds 更新の反映）
  try {
    const snapshot = {
      coupons: JSON.parse(localStorage.getItem(`myCoupons_${userId}`) || "[]"),
      restaurantData: JSON.parse(localStorage.getItem(`restaurantData_${userId}`) || "[]"),
      gachaState: JSON.parse(localStorage.getItem(gachaKey) || "{}")
    };
    saveGachaStateToServer(snapshot).catch(e => console.warn("save after drawStore failed:", e));
  } catch (e) { console.warn(e); }

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
    gachaButtonImage.classList.add("zoom");
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

/* --- 追加: 一元的な state 保存ユーティリティ (debounce + dedupe + flushPromise) --- */
const stateSync = (function () {
  const LOG_URL_FALLBACK = "https://script.google.com/macros/s/AKfycbxTsZVOZfn5xoySkypMrYt_6pd0xtNcTtaxOxRPvjZXqXttv1wd5U0vVSUZg5_W6KmT/exec";
  const getUrl = () => (typeof LOG_URL !== "undefined") ? LOG_URL : (window.LOG_URL || LOG_URL_FALLBACK);

  let timer = null;
  let pendingSnapshot = null;
  let lastSentHash = null;
  let inFlight = false;
  let paused = false;

  function hashSnapshot(s) {
    try { return JSON.stringify(s); } catch (e) { return String(Date.now()); }
  }

  function doSend(snapshot) {
    const uid = localStorage.getItem("userId");
    if (!uid) return Promise.resolve({ skipped: true, reason: "no userId" });
    const url = getUrl();
    snapshot = snapshot || {};
    snapshot.updatedAt = Date.now();

    // persist updatedAt to local gacha state
    try {
      const gKey = `gachaState_${uid}`;
      const g = JSON.parse(localStorage.getItem(gKey) || "{}");
      g.updatedAt = snapshot.updatedAt;
      localStorage.setItem(gKey, JSON.stringify(g));
    } catch (e) { /* ignore */ }

    const payload = { eventType: "saveState", userId: uid, state: snapshot };
    inFlight = true;
    return fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8" },
      body: "data=" + encodeURIComponent(JSON.stringify(payload))
    }).then(r => r.text()).then(t => {
      let parsed = null;
      try { parsed = JSON.parse(t); } catch (e) { parsed = { raw: t }; }
      lastSentHash = hashSnapshot(snapshot);
      return parsed;
    }).finally(() => { inFlight = false; });
  }

  return {
    requestSave(snapshot) {
      // keep latest pending even when paused (do not send while paused)
      pendingSnapshot = snapshot;
      if (paused) return;
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => {
        const h = hashSnapshot(pendingSnapshot || {});
        if (h === lastSentHash) { pendingSnapshot = null; timer = null; return; }
        if (inFlight) {
          timer = setTimeout(() => { stateSync.requestSave(pendingSnapshot); }, 300);
          return;
        }
        doSend(pendingSnapshot).catch(err => console.warn("stateSync send error:", err));
        pendingSnapshot = null;
        timer = null;
      }, 600);
    },
    // 即時送信（テストやガチャフローの最後で利用）
    flushNow() {
      return new Promise((resolve) => {
        if (timer) { clearTimeout(timer); timer = null; }
        if (!pendingSnapshot) return resolve({ skipped: true });
        // wait until no inFlight, then send
        const attempt = () => {
          if (inFlight) { setTimeout(attempt, 200); return; }
          if (paused) { setTimeout(attempt, 200); return; }
          doSend(pendingSnapshot).then(res => resolve(res)).catch(err => resolve({ error: String(err) }));
          pendingSnapshot = null;
        };
        attempt();
      });
    },
    pause() { paused = true; },
    resume() { paused = false; if (pendingSnapshot) this.requestSave(pendingSnapshot); },
    _debugState() { return { paused, inFlight, lastSentHash }; }
  };
})();

// 公開して他ファイルから参照可能にする
window.stateSync = stateSync;

/* --- 追加: 既存の saveGachaStateToServer を stateSync 経由に置換する薄い wrapper --- */
function saveGachaStateToServer(stateObj, { immediate = false } = {}) {
  try {
    // 既存コードや他ファイルがこの関数を呼んでいる想定のため wrapper を残す
    stateSync.requestSave(stateObj);
    if (immediate) return stateSync.flushNow();
    return Promise.resolve({ queued: true });
  } catch (e) {
    return Promise.reject(e);
  }
}

/* --- 追加: getSalonId の安全実装 --- */
function getSalonId() {
  try {
    if (typeof window.getSalonId === "function") return window.getSalonId();
  } catch(e){}
  // フォールバック: localStorage や gacha で持っている場合
  return localStorage.getItem("salonId") || null;
}

/*
  安全ガード／初期化ラッパーの追加
  - stateSync / getSalonId / load/apply のフォールバックを用意
  - DOMContentLoaded 時にサーバ state を読み込んでから既存初期化を呼ぶ
*/
(function(){
  // stateSync フォールバック（他ファイルから参照されるため window にセット）
  if (!window.stateSync) {
    window.stateSync = {
      requestSave: function() { return; },
      flushNow: function(){ return Promise.resolve({skipped:true}); },
      pause: function(){},
      resume: function(){},
      _debugState: function(){ return {}; }
    };
  }

  // getSalonId を確実に提供（既定値は localStorage）
  if (typeof window.getSalonId !== "function") {
    window.getSalonId = function() {
      try {
        return (typeof getSalonId === "function") ? getSalonId() : localStorage.getItem("salonId") || null;
      } catch(e) {
        return localStorage.getItem("salonId") || null;
      }
    };
  }

  // loadGachaStateFromServer / applyServerStateToLocal が未定義なら簡易実装をセット（本実装がある場合は上書きしない）
  if (typeof window.loadGachaStateFromServer !== "function") {
    window.loadGachaStateFromServer = function(userId) {
      return Promise.resolve({ status: "OK", found: false, state: {} });
    };
  }
  if (typeof window.applyServerStateToLocal !== "function") {
    window.applyServerStateToLocal = function(serverState, userId){
      try {
        if (!userId || !serverState) return;
        if (serverState.coupons) localStorage.setItem(`myCoupons_${userId}`, JSON.stringify(serverState.coupons));
        if (serverState.restaurantData) localStorage.setItem(`restaurantData_${userId}`, JSON.stringify(serverState.restaurantData));
        if (serverState.gachaState) localStorage.setItem(`gachaState_${userId}`, JSON.stringify(serverState.gachaState));
      } catch(e){ console.warn("apply fallback failed:", e); }
    };
  }

  // グローバルエラーをコンソールに出す（初期化が途中で止まるのを可視化）
  window.addEventListener("error", function(ev){
    console.error("Unhandled error:", ev.error || ev.message, ev.filename + ":" + ev.lineno);
  });

  // DOMContentLoaded の安全初期化ラッパー
  document.addEventListener("DOMContentLoaded", async function safeGachaInit(){
    try {
      const userId = localStorage.getItem("userId");
      if (userId) {
        try {
          const res = await loadGachaStateFromServer(userId);
          if (res && res.status === "OK" && res.found && res.state) {
            applyServerStateToLocal(res.state, userId);
            console.log("gacha.js: applied server state for user", userId);
          } else {
            console.info("gacha.js: no server state or response", res);
          }
        } catch (e) {
          console.warn("gacha.js: loadGachaStateFromServer failed:", e);
        }
      }

      // 既存の初期化関数があれば呼ぶ（存在すれば実行）
      try {
        if (typeof initGachaUI === "function") {
          initGachaUI();
        } else {
          // 既存コードの初期化箇所が分からない場合、既存の DOMContentLoaded ハンドラが続行するためここでは何もしない
        }
      } catch (e) {
        console.warn("gacha.js: initGachaUI failed:", e);
      }
    } catch (err) {
      console.error("gacha safe init failed:", err);
    }
  }, { once: true });

})();

// 安全に user の店舗リストを取得するユーティリティ
function getRestaurantListForUser(uid) {
  try {
    // UID がないなら global 初期データを返す
    if (!uid) return (window.initialRestaurantData || []).slice();

    const key = `restaurantData_${uid}`;
    const raw = localStorage.getItem(key);
    if (raw) {
      const parsed = JSON.parse(raw || "[]");
      if (Array.isArray(parsed) && parsed.length) return parsed;
    }

    // 互換性のため legacy キーも確認する（以前の実装で使っていた場合）
    const legacyRaw = localStorage.getItem("restaurantData");
    if (legacyRaw) {
      const parsedL = JSON.parse(legacyRaw || "[]");
      if (Array.isArray(parsedL) && parsedL.length) {
        // ユーザ用キーへ移行しておく
        localStorage.setItem(key, JSON.stringify(parsedL));
        return parsedL;
      }
    }

    // 最終フォールバック： global initial data
    return (window.initialRestaurantData || []).slice();
  } catch (e) {
    console.warn("getRestaurantListForUser failed:", e);
    return (window.initialRestaurantData || []).slice();
  }
}

// 抽選プール作成のサンプル（既存ロジックに合わせてフィルタ条件を調整してください）
function buildPrizePool(uid, prizeType) {
  const restaurants = getRestaurantListForUser(uid);
  if (!Array.isArray(restaurants) || restaurants.length === 0) {
    console.warn("抽選対象の店舗がありません (userId:", uid, ")");
    return [];
  }

  const pool = [];
  for (const s of restaurants) {
    // ここは既存の判定ロジックに合わせること
    // 例: s.unlocked が false でも抽選対象にする仕様なら変更してください
    if (s && !s.excluded) {
      // 賞種ごとの条件があればここで絞る
      pool.push(s);
    }
  }
  return pool;
}

// 既存の initializeRestaurantData がある箇所の直後に挿入
(function ensurePerUserRestaurantData() {
  try {
    const uid = localStorage.getItem("userId");
    if (!uid) return; // userId 未設定なら何もしない

    const perKey = `restaurantData_${uid}`;
    if (!localStorage.getItem(perKey)) {
      // まず legacy キーを確認、なければ global 初期データを使う
      const legacy = localStorage.getItem("restaurantData");
      if (legacy) {
        localStorage.setItem(perKey, legacy);
        console.info("copied legacy restaurantData ->", perKey);
      } else {
        localStorage.setItem(perKey, JSON.stringify(window.initialRestaurantData || []));
        console.info("initialized", perKey, "from window.initialRestaurantData");
      }
    }
  } catch (e) {
    console.warn("ensurePerUserRestaurantData failed:", e);
  }
})();

// --- helper: preloadVideo, tryPlayWithSoundFallback, skip button, and logging ---
function preloadVideo(videoEl, url, { preload = "auto", timeout = 5000 } = {}) {
  return new Promise((resolve, reject) => {
    if (!videoEl) return reject(new Error("preloadVideo: no video element"));
    try {
      // set src if different
      if (!videoEl.src || !videoEl.src.endsWith(url)) {
        videoEl.pause();
        videoEl.src = url;
        videoEl.load();
      }
    } catch (e) {
      // fallthrough to waiting logic
    }

    let settled = false;
    const onLoaded = () => { if (settled) return; settled = true; cleanup(); resolve(); };
    const onError = () => { if (settled) return; settled = true; cleanup(); reject(new Error("video load error")); };
    const cleanup = () => {
      videoEl.removeEventListener("loadeddata", onLoaded);
      videoEl.removeEventListener("error", onError);
      clearTimeout(timer);
    };

    videoEl.addEventListener("loadeddata", onLoaded);
    videoEl.addEventListener("error", onError);

    const timer = setTimeout(() => {
      if (settled) return;
      settled = true;
      cleanup();
      // タイムアウトしてもエラーにせず resolve させる（フォールバック再生へ）
      resolve();
    }, timeout);
  });
}

async function tryPlayWithSoundFallback(videoEl) {
  if (!videoEl) throw new Error("tryPlayWithSoundFallback: no video element");
  // まず音ありで試す（ユーザーが gesture を与えていれば通る）
  try {
    videoEl.muted = false;
    // iOS 等で volume を設定すると例外になる可能性があるので try/catch
    try { videoEl.volume = 1; } catch (e) {}
    await videoEl.play();
    return { muted: false };
  } catch (err) {
    // 音ありで失敗したらミュートで再生を試みる
    try {
      videoEl.muted = true;
      await videoEl.play();
      return { muted: true };
    } catch (err2) {
      // 再生できない場合は呼び出し元でフォールバックを行う
      throw new Error("video play failed (both with/without sound)");
    }
  }
}

function createSkipButton() {
  let btn = document.querySelector(".skip-gacha-btn");
  if (btn) return btn;
  btn = document.createElement("button");
  btn.type = "button";
  btn.className = "skip-gacha-btn";
  btn.textContent = "スキップ";
  // スタイルは CSS 側で .skip-gacha-btn を用意しておくと良い
  const container = document.getElementById("gacha-popup") || document.body;
  container.appendChild(btn);
  return btn;
}

function removeSkipButton() {
  const btn = document.querySelector(".skip-gacha-btn");
  if (btn && btn.parentNode) btn.parentNode.removeChild(btn);
}

// simple logger POST helper (Apps Script expects form-urlencoded 'data=')
function postToLog(payload) {
  const url = (typeof LOG_URL !== "undefined") ? LOG_URL : (window.LOG_URL || "");
  if (!url) {
    console.warn("postToLog: LOG_URL not configured — skipping network send, payload:", payload);
    // ここでは resolved Promise を返してエラーを投げないようにする
    return Promise.resolve({ skipped: true });
  }
  return fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8" },
    body: "data=" + encodeURIComponent(JSON.stringify(payload))
  }).then(r => r.text()).catch(err => {
    console.warn("postToLog fetch failed:", err);
    throw err;
  });
}

function sendVideoLog(payload) {
  // payload: { userId, storeId, storeName, prizeType, salonId, ... }
  const p = Object.assign({ eventType: "viewed", ts: Date.now() }, payload);
  return postToLog(p);
}

function sendGachaLog(payload) {
  const p = Object.assign({ eventType: "gacha", ts: Date.now() }, payload);
  return postToLog(p);
}

async function loadGachaStateFromServer(userId) {
  const urlBase = (typeof LOG_URL !== "undefined") ? LOG_URL : (window.LOG_URL || "");
  if (!urlBase) {
    console.warn("loadGachaStateFromServer: LOG_URL not configured");
    return null;
  }
  try {
    const url = urlBase + "?action=getState&userId=" + encodeURIComponent(userId);
    const res = await fetch(url);
    const text = await res.text();
    try {
      return JSON.parse(text);
    } catch (e) {
      console.warn("loadGachaStateFromServer: parse error", e, text);
      return null;
    }
  } catch (e) {
    console.warn("loadGachaStateFromServer fetch failed", e);
    return null;
  }
}

function applyServerStateToLocal(payload, userId) {
  // payload: { status, found, state: { coupons, restaurantData, gachaState, updatedAt } }
  if (!payload || !payload.found || !payload.state) return false;
  const server = payload.state;
  // compare updatedAt to avoid overwriting newer local data
  const serverTs = server.updatedAt || server._serverReceivedAt || 0;
  // read local snapshot ts if any
  const localGacha = JSON.parse(localStorage.getItem(`gachaState_${userId}`) || "{}");
  const localTs = localGacha && localGacha.updatedAt ? localGacha.updatedAt : 0;
  if (serverTs && localTs && localTs > serverTs) {
    console.info("local state is newer than server — skipping overwrite");
    return false;
  }
  // apply coupons
  if (server.coupons) {
    try { localStorage.setItem(`myCoupons_${userId}`, JSON.stringify(server.coupons)); } catch(e){ console.warn(e); }
  }
  if (server.restaurantData) {
    try { localStorage.setItem(`restaurantData_${userId}`, JSON.stringify(server.restaurantData)); } catch(e){ console.warn(e); }
  }
  if (server.gachaState) {
    try {
      // preserve updatedAt
      const g = Object.assign({}, server.gachaState);
      if (!g.updatedAt) g.updatedAt = serverTs || Date.now();
      localStorage.setItem(`gachaState_${userId}`, JSON.stringify(g));
    } catch(e){ console.warn(e); }
  }
  return true;
}


