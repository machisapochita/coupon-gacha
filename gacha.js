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

  // 当選店舗をアンロックしてクーポンを用意（PR 再生前に状態を更新）
  store.prizeType = prizeType;
  store.unlocked = true;
  updateRestaurantData(store);
  addCoupon(store, prizeType);

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

// その他の関数のあとに追加
function getSalonId() {
  return localStorage.getItem("salonId") || "salon000"; // fallback付き
}

document.addEventListener("DOMContentLoaded", async () => {
  const userId = localStorage.getItem("userId");
  const gachaKey = `gachaState_${userId}`;
  const restaurantKey = `restaurantData_${userId}`;
  const couponKey = `myCoupons_${userId}`;

  // 1) 可能ならサーバーから state をフェッチしてローカルを完全上書き（サーバ優先）
  if (userId) {
    try {
      const res = await loadGachaStateFromServer(userId);
      if (res && res.status === "OK" && res.found && res.state) {
        applyServerStateToLocal(res.state, userId);
        console.log("Applied server state on gacha load for user:", userId);
      } else {
        console.info("No server state or fetch response:", res);
      }
    } catch (e) {
      console.warn("Failed to load server state on gacha load:", e);
    }
  }

  // 2) その後にローカル初期化（サーバに無ければ初期化する）
  if (!localStorage.getItem(gachaKey)) {
    const gachaState = {
      remaining: 10,
      drawnStoreIds: [],
      prizePool: ["normal","normal","normal","normal","normal","normal","normal","rare","rare"]
    };
    localStorage.setItem(gachaKey, JSON.stringify(gachaState));
  }

  if (!localStorage.getItem(restaurantKey)) {
    localStorage.setItem(restaurantKey, JSON.stringify(window.initialRestaurantData));
  }

  // クーポン合計金額の復元
  const coupons = JSON.parse(localStorage.getItem(couponKey)) || [];
  const totalAmount = coupons.reduce((sum, c) => sum + c.discount, 0);
  updateCouponSummary(totalAmount);

  // 表示更新
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

  const url = "https://script.google.com/macros/s/AKfycbxmVyp4bL0XC2-he0HNL29YZckIKXMUAG-_IMrxUXL5dPnTjgwBJigg9iAQnE1lI4DM/exec";

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

/**
 * video を指定 URL で preload -> canplaythrough / loadeddata を待って resolve するヘルパ
 * - videoEl: HTMLVideoElement
 * - url: string
 * - opts: { preload: 'metadata'|'auto', timeout: ms }
 */
function preloadVideo(videoEl, url, opts = {}) {
  const preloadMode = opts.preload || 'metadata';
  const timeout = opts.timeout || 8000;

  return new Promise((resolve, reject) => {
    if (!videoEl) return reject(new Error('no video element'));
    // 既に同じ src なら canplaythrough を待つ
    const srcChanged = videoEl.src !== url;
    videoEl.preload = preloadMode;

    let timer = setTimeout(() => {
      cleanup();
      // タイムアウトしても loadeddata くらいあれば進める
      resolve({ timeout: true });
    }, timeout);

    function onCanPlay() {
      cleanup();
      resolve({ ok: true });
    }
    function onLoadedData() {
      cleanup();
      resolve({ ok: true });
    }
    function onError(e) {
      cleanup();
      reject(e || new Error('video load error'));
    }
    function cleanup() {
      clearTimeout(timer);
      videoEl.removeEventListener('canplaythrough', onCanPlay);
      videoEl.removeEventListener('loadeddata', onLoadedData);
      videoEl.removeEventListener('error', onError);
    }

    videoEl.addEventListener('canplaythrough', onCanPlay, { once: true });
    videoEl.addEventListener('loadeddata', onLoadedData, { once: true });
    videoEl.addEventListener('error', onError, { once: true });

    if (srcChanged) {
      // src を差し替えて読み込み開始
      videoEl.src = url;
      try { videoEl.load(); } catch (e) { /* ignore */ }
    } else {
      // 既に同じ src の場合もイベント待ち
    }
  });
}

// 追加: 音声つき再生を試み、失敗したら無音で再生するユーティリティ
function tryPlayWithSoundFallback(videoEl) {
  if (!videoEl) return Promise.reject(new Error("no video element"));
  // 優先で音声ありを試す
  videoEl.muted = false;
  try { videoEl.volume = 1; } catch(e) {}
  return videoEl.play().then(() => ({ muted: false }))
    .catch(async (err) => {
      console.warn("play with sound failed, falling back to muted play:", err);
      // 無音にして再生（少なくとも映像は見せる）
      videoEl.muted = true;
      try {
        await videoEl.play();
        return { muted: true };
      } catch (err2) {
        console.error("muted play also failed:", err2);
        throw err2;
      }
    });
}

// --- 追加: gacha 演出スキップボタン生成/破棄ユーティリティ ---
function createSkipButton() {
  if (document.getElementById("skip-gacha-btn")) return;
  const btn = document.createElement("button");
  btn.id = "skip-gacha-btn";
  btn.type = "button";
  btn.textContent = "演出をスキップ";
  btn.className = "skip-gacha-btn";
  document.body.appendChild(btn);
  return btn;
}

function removeSkipButton() {
  const el = document.getElementById("skip-gacha-btn");
  if (el) {
    try { el.remove(); } catch(e) { el.parentNode && el.parentNode.removeChild(el); }
  }
}
// --- 追加ここまで ---

/**
 * サーバへ gacha 状態を保存（Apps Script に data=... の form-urlencoded で送る）
 */
function saveGachaStateToServer(stateObj, opts = { retry: 1 }) {
  try {
    const uid = localStorage.getItem("userId");
    if (!uid) return Promise.resolve({ skipped: true, reason: "no userId" });

    const LOG_URL_FALLBACK = "https://script.google.com/macros/s/AKfycbyeXtfLCqsp3aH6V2h7phVw14MRF803iprYx1aPgL6t8wX0Zfkok4xt6KmG4pusz2Hg/exec";
    const url = (typeof LOG_URL !== "undefined") ? LOG_URL : (window.LOG_URL || LOG_URL_FALLBACK);

    // mark updatedAt on snapshot
    try {
      stateObj = stateObj || {};
      stateObj.updatedAt = Date.now();
      // also persist updatedAt locally to avoid later overwrite by older server state
      const gachaKey = `gachaState_${uid}`;
      const localG = JSON.parse(localStorage.getItem(gachaKey) || "{}");
      localG.updatedAt = stateObj.updatedAt;
      localStorage.setItem(gachaKey, JSON.stringify(localG));
    } catch (e) { console.warn("saveGachaStateToServer: local updatedAt set failed", e); }

    const payload = { eventType: "saveState", userId: uid, state: stateObj };
    return fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8" },
      body: "data=" + encodeURIComponent(JSON.stringify(payload))
    })
    .then(r => r.text())
    .then(t => {
      try { return JSON.parse(t); } catch (e) { return { raw: t }; }
    })
    .catch(err => {
      if (opts.retry > 0) {
        console.warn("saveGachaStateToServer failed, retrying:", err);
        return new Promise((res) => setTimeout(res, 600)).then(() => saveGachaStateToServer(stateObj, { retry: opts.retry - 1 }));
      }
      return Promise.reject(err);
    });
  } catch (e) {
    return Promise.reject(e);
  }
}

/**
 * サーバから保存済み state を取得（doGet?action=getState&userId=...）
 */
function loadGachaStateFromServer(userId) {
  try {
    if (!userId) return Promise.resolve({ found: false, state: {} });
    const LOG_URL_FALLBACK = "https://script.google.com/macros/s/AKfycbxmVyp4bL0XC2-he0HNL29YZckIKXMUAG-_IMrxUXL5dPnTjgwBJigg9iAQnE1lI4DM/exec";
    const baseUrl = (typeof LOG_URL !== "undefined") ? LOG_URL : (window.LOG_URL || LOG_URL_FALLBACK);
    const url = baseUrl + "?action=getState&userId=" + encodeURIComponent(userId);
    return fetch(url, { method: "GET" })
      .then(r => r.text())
      .then(text => { try { return JSON.parse(text); } catch (e) { return { status: "parse-error", raw: text }; } });
  } catch (e) {
    return Promise.reject(e);
  }
}

/**
 * サーバ state をローカルに適用（今回の要件は「サーバ優先で完全上書き」）
 */
function applyServerStateToLocal(serverState, userId) {
  try {
    if (!userId || !serverState) return;
    const couponsKey = `myCoupons_${userId}`;
    const restaurantsKey = `restaurantData_${userId}`;
    const gachaKey = `gachaState_${userId}`;

    // local updatedAt を取得（数値）
    const localGacha = JSON.parse(localStorage.getItem(gachaKey) || "{}");
    const localUpdated = Number(localGacha.updatedAt || 0);
    const serverUpdated = Number(serverState.updatedAt || 0);

    // サーバが新しければ上書き、そうでなければスキップ
    if (serverUpdated && serverUpdated <= localUpdated) {
      console.info("applyServerStateToLocal: server state older or equal, skip apply", { serverUpdated, localUpdated });
      return;
    }

    if (serverState.coupons) {
      localStorage.setItem(couponsKey, JSON.stringify(serverState.coupons));
    }
    if (serverState.restaurantData) {
      localStorage.setItem(restaurantsKey, JSON.stringify(serverState.restaurantData));
    }
    if (serverState.gachaState) {
      // preserve updatedAt from serverState if present
      const g = serverState.gachaState || {};
      if (serverState.updatedAt && (!g.updatedAt || Number(g.updatedAt) < Number(serverState.updatedAt))) {
        g.updatedAt = serverState.updatedAt;
      }
      localStorage.setItem(gachaKey, JSON.stringify(g));
    }
    console.log("applyServerStateToLocal: applied server state for user:", userId);
  } catch (e) {
    console.warn("applyServerStateToLocal failed:", e);
  }
}
