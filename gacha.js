// グローバルガード（ファイル頭か共通ヘルパで一度だけ）
window.__applyingServerState = window.__applyingServerState || false;

// --- requestSaveSnapshotSafe の冒頭ガード（apply 中はキュー化してスキップ） ---
function requestSaveSnapshotSafe(snapshot, immediate) {
  // ensure updatedAt exists on snapshot and nested gachaState
  snapshot = snapshot || {};
  snapshot.updatedAt = snapshot.updatedAt || Date.now();
  if (snapshot.state && snapshot.state.gachaState) {
    snapshot.state.gachaState.updatedAt = snapshot.state.gachaState.updatedAt || snapshot.updatedAt;
  }

  // apply 中は保存をスキップしてキュー化（最後に一度だけ送る）
  if (window.__applyingServerState) {
    console.log('requestSaveSnapshotSafe: currently applying server state — queueing snapshot (skipped for now)');
    // store minimal queued info: userId to flush after apply
    try {
      // queued snapshot may be heavy; we can store userId only and let saveStateSnapshotNow rebuild snapshot from localStorage after apply
      if (snapshot && snapshot.userId) {
        window.__queuedSnapshotUserId = snapshot.userId;
      } else if (typeof snapshot.userId === 'undefined') {
        // try to find userId from snapshot.state or existing localStorage
        const uid = (snapshot.state && snapshot.state.userId) || localStorage.getItem('userId');
        window.__queuedSnapshotUserId = uid;
      }
    } catch(e) { console.error(e); }
    // keep one queued marker
    window.__queuedSnapshot = true;
    // resolve so callers don't hang
    return Promise.resolve({ skippedDuringApply: true });
  }

  // 以下は既存の保存フロー（stateSync / fetch など）を続行してください
  console.log('📦 Saving snapshot:', snapshot);
  // 例: use window.stateSync if available, else fallback
  const sender = (window.stateSync && window.stateSync.requestSave) ? window.stateSync.requestSave : saveSnapshotToServerFallback;
  return Promise.resolve(sender(snapshot, immediate)).then(res => {
    // 成功時の last-saved 更新
    try { window.__lastSavedSnapshotJson = JSON.stringify(snapshot); } catch(e){}
    return res;
  }).catch(err => { console.error('requestSaveSnapshotSafe: send error', err); throw err; });
}

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
    key: "11111",
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
    key: "22222",
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
    key: "33333",
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
    key: "44444",
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
    key: "55555",
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
    key: "66666",
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
    key: "77777",
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
    key: "88888",
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
    key: "99999",
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
    key: "11112",
    coupons: {
      normal: { discount: 200, conditions: ["とんかつ定食注文", "店内飲食限定"], expiry: "2025/12/31" },
      rare: { discount: 500, conditions: ["ロースかつ＋ドリンクセット"], expiry: "2025/12/31" },
      "last-one": { discount: 1000, conditions: ["特選ヒレかつコース限定"], expiry: "2025/12/31" }
    }
  }
];

// -----------------------------
// variant storeId 解決ヘルパー
// baseId + prizeType から確定的に variant storeId を返す
// 例: baseId 'bar001', prizeType 'rare' -> 'bar001-2'
// -----------------------------
function resolveVariantStoreId(storeOrBaseId, prizeType) {
  try {
    // 入力は store オブジェクトか baseId の文字列を受け取る
    let baseId = null;
    if (!storeOrBaseId) return null;
    if (typeof storeOrBaseId === 'string') baseId = storeOrBaseId;
    else baseId = storeOrBaseId.baseId || (storeOrBaseId.storeId ? String(storeOrBaseId.storeId).split('-')[0] : null);

    if (!baseId) return null;

    const map = { normal: '1', rare: '2', 'last-one': '3' };
    const key = prizeType || (storeOrBaseId && storeOrBaseId.prizeType) || 'normal';
    const suffix = map[key] || '1';
    return `${baseId}-${suffix}`;
  } catch (e) {
    console.warn("resolveVariantStoreId failed:", e);
    return null;
  }
}

// --- START: automatically assign 5-digit keys to each base and build initialRestaurantData ---
baseRestaurantData.forEach(base => {
  try {
    if (!base.key) {
      // 10000〜99999 のランダム5桁（文字列で保持）
      base.key = String(Math.floor(10000 + Math.random() * 90000));
    }
  } catch (e) {
    console.warn("assign base.key failed for", base && base.baseId, e);
  }
});

window.initialRestaurantData = baseRestaurantData.flatMap(base => {
  const variants = Number(base.variants || 1);
  const out = [];
  for (let i = 1; i <= variants; i++) {
    const storeId = `${base.baseId}-${i}`;
    out.push({
      storeId: storeId,
      id: storeId,
      baseId: base.baseId,
      name: (base.name || "") + (variants > 1 ? ` ${i}` : ""),
      town: base.town || "",
      prizeType: base.prizeType || (base.prize || "normal"),
      // base 側では複数賞種を 'coupons' で持っているため店舗にもそのまま渡す
      coupons: base.coupons || null,
      // 互換用に単一 coupon が base にあれば設定（あれば store.coupon として使われる）
      coupon: base.coupon || null,
      unlocked: !!base.unlocked,
      images: base.images || [],
      hpUrl: base.hpUrl || null,
      mapUrl: base.mapUrl || null,
      // PR 動画 URL を各店舗にも渡す（これがないと PR を再生できない）
      videoUrl: base.videoUrl || null,
      hours: base.hours || null,
      // base に設定した key を各店舗に渡す
      key: base.key
    });
  }
  return out;
});

// マイグレーション関数（per-user の restaurantData_{uid} に必要フィールドを注入）
function migrateRestaurantKeysEnhForUser(userId) {
  try {
    userId = userId || localStorage.getItem("userId");
    if (!userId) return false;
    const storageKey = `restaurantData_${userId}`;
    const raw = localStorage.getItem(storageKey);
    if (!raw) return false;

    let existing;
    try { existing = JSON.parse(raw || "[]"); } catch (e) { existing = []; }
    if (!Array.isArray(existing) || existing.length === 0) return false;

    const baseMap = {};
    (baseRestaurantData || []).forEach(b => { if (b && b.baseId) baseMap[b.baseId] = b; });

    let changed = false;
    const updated = existing.map(s => {
      if (!s || typeof s !== 'object') return s;

      // baseId 推測
      const guessedBaseId = s.baseId || (typeof s.storeId === 'string' ? s.storeId.split('-')[0] : null);
      const base = (guessedBaseId && baseMap[guessedBaseId]) ? baseMap[guessedBaseId] : null;

      if (base) {
        const fields = ['videoUrl','coupons','coupon','images','hpUrl','mapUrl','hours','key','name','town'];
        for (const f of fields) {
          try {
            const hasField = typeof s[f] !== 'undefined' && s[f] !== null && !(typeof s[f] === 'string' && s[f].trim() === '');
            if (!hasField && typeof base[f] !== 'undefined') {
              s[f] = JSON.parse(JSON.stringify(base[f]));
              changed = true;
            }
          } catch (e) { /* ignore per-field error */ }
        }

        // prizeType があれば対応する coupon を補う
        try {
          if ((!s.coupon || Object.keys(s.coupon || {}).length === 0) && s.prizeType && base.coupons && base.coupons[s.prizeType]) {
            s.coupon = JSON.parse(JSON.stringify(base.coupons[s.prizeType]));
            changed = true;
          }
        } catch (e) {}
      } else {
        // base がない場合でも key を補う試み
        try {
          if (!s.key && typeof s.storeId === 'string') {
            const prefix = s.storeId.split('-')[0];
            const b = (baseRestaurantData || []).find(x => x.baseId === prefix);
            if (b && b.key) { s.key = b.key; changed = true; }
          }
        } catch (e) {}
      }

      return s;
    });

    if (changed) {
      localStorage.setItem(storageKey, JSON.stringify(updated));
      console.info("migrateRestaurantKeysEnhForUser: injected missing fields into", storageKey);
    } else {
      console.info("migrateRestaurantKeysEnhForUser: no changes needed for", storageKey);
    }
    return changed;
  } catch (e) {
    console.warn("migrateRestaurantKeysEnhForUser failed:", e);
    return false;
  }
}

// 即時実行（ファイル読み込み直後に per-user データが既にあれば注入）
try { migrateRestaurantKeysEnhForUser(); } catch (e) { /* ignore */ }

// --- 追加: ページ初期化（UI更新をここで一元化） ---
function initGachaUI() {
  try {
    // ensure per-user restaurant data exists
    try { window.initializeRestaurantData && window.initializeRestaurantData(); } catch(e){}

    // ensure per-user data exists, then run migration to backfill fields
    try {
      // initializeRestaurantData may create per-user restaurantData_{uid}
      window.initializeRestaurantData && window.initializeRestaurantData();
      // run migration again now that per-user key exists
      migrateRestaurantKeysEnhForUser();
    } catch (e) {
      console.warn("initGachaUI: migration run failed", e);
    }

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

// DOMContentLoaded 時に initGachaUI を確実に呼ぶ（loading-overlay を末尾に移動して表示）
document.addEventListener("DOMContentLoaded", async () => {
  // 該当オーバーレイを取得（無ければ null）
  const loadingOverlay = (typeof document !== "undefined") ? document.getElementById("loading-overlay") : null;
  try {
    if (loadingOverlay) {
      try {
        // 1) 要素を body の末尾に移動して stacking を安定化
        try { document.body.appendChild(loadingOverlay); } catch(e) { /* ignore */ }

        // 2) 念のためインラインで z-index を強制（CSS の上書き回避）
        try { loadingOverlay.style.zIndex = "99999"; } catch(e) {}

        // 3) 表示
        try { loadingOverlay.classList.remove("hidden"); } catch(e) { loadingOverlay.style.display = "flex"; }
      } catch(e) { console.warn("loading-overlay show failed:", e); }
    }

    // initGachaUI が非同期処理を含む可能性がある場合に await しても安全
    await (typeof initGachaUI === "function" ? initGachaUI() : Promise.resolve());
  } catch (e) {
    console.warn("DOMContentLoaded initGachaUI failed:", e);
  } finally {
    // 隠す（存在チェック付き）
    if (loadingOverlay) {
      try { loadingOverlay.classList.add("hidden"); } catch(e) { loadingOverlay.style.display = "none"; }
    }
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
  // 存在しないページ（例：restaurants.html の場合など）は無視する
  if (!summary) {
    const totalEl = document.getElementById("total-amount");
    if (totalEl) totalEl.textContent = `${amount}円`;
    return;
  }

  summary.classList.remove("silver", "gold", "rainbow");

  if (amount >= 2000) {
    summary.classList.add("rainbow");
  } else if (amount >= 1000) {
    summary.classList.add("gold");
  } else {
    summary.classList.add("silver");
  }

  const totalEl = document.getElementById("total-amount");
  if (totalEl) totalEl.textContent = `${amount}円`;
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

  // --- gacha 用読み込みオーバーレイ参照（存在する場合） ---
  const loadingOverlay = (typeof document !== "undefined") ? document.getElementById("loading-overlay") : null;
  try { if (loadingOverlay) { try { loadingOverlay.classList.remove("hidden"); } catch(e) { loadingOverlay.style.display = "flex"; } } } catch(e){}

  // 1) 抽選を先に行う（賞種と店舗）
  const prizeType = drawPrizeType();
  const store = drawStore(prizeType);

  // 抽選で選ばれた store が base 情報を欠いている可能性があるため補完する
  try {
    // store.baseId がなければ storeId のプレフィックスから推測する
    const guessedBaseId = store && (store.baseId || (typeof store.storeId === 'string' ? store.storeId.split('-')[0] : null));
    const base = (window.baseRestaurantData || []).find(b => b.baseId === guessedBaseId);

    if (base) {
      // videoUrl / coupons を補う
      if (!store.videoUrl && base.videoUrl) store.videoUrl = base.videoUrl;
      if (!store.coupons && base.coupons) store.coupons = JSON.parse(JSON.stringify(base.coupons));
      if ((!store.images || store.images.length === 0) && base.images) store.images = JSON.parse(JSON.stringify(base.images));
      if (!store.hours && base.hours) store.hours = base.hours;
      if (!store.hpUrl && base.hpUrl) store.hpUrl = base.hpUrl;
      if (!store.mapUrl && base.mapUrl) store.mapUrl = base.mapUrl;
      if (!store.baseId && base.baseId) store.baseId = base.baseId;
    }

    // 重要: 当選した賞種に対応する coupon フィールドを必ず上書きする（既存の単一 coupon があっても差し替える）
    if (prizeType) {
      // まず店舗の coupons マップから
      if (store && store.coupons && store.coupons[prizeType]) {
        store.coupon = JSON.parse(JSON.stringify(store.coupons[prizeType]));
      } else if (base && base.coupons && base.coupons[prizeType]) {
        // 次に base の coupons から
        store.coupon = JSON.parse(JSON.stringify(base.coupons[prizeType]));
      } else {
        // 最後のフォールバックは既存の store.coupon のまま（無ければデフォルト）
        if (!store.coupon) store.coupon = { discount: 0, conditions: [], expiry: "" };
      }
    }
  } catch (e) {
    console.warn("gacha: failed to enrich/store-assign coupon from base data", e);
  }

  console.log("抽選された賞種:", prizeType);
  // 追加（デバッグ）: 当選直後に選ばれた store の概要を出力
  try {
    console.info("DBG: pre-addCoupon store summary:", {
      storeId: store && store.storeId,
      baseId: store && store.baseId,
      prizeType,
      hasStoreCoupons: !!(store && store.coupons),
      storeCouponsKeys: store && store.coupons ? Object.keys(store.coupons) : null,
      hasStoreCouponField: !!(store && store.coupon)
    });
  } catch(e) { console.warn("DBG log failed", e); }
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

  // --- variant mapping apply ---
  try {
    // resolveVariantStoreId は gacha.js 内に追加済み、なければ別途追加してください
    const resolvedVariantId = resolveVariantStoreId(store, prizeType);
    if (resolvedVariantId) {
      // variantStoreId を保存し、以降の snapshot/log で使われるように store.storeId を上書き
      store.variantStoreId = resolvedVariantId;
      store.storeId = resolvedVariantId;
      console.info("DBG: applied variant storeId:", resolvedVariantId);
    } else {
      console.info("DBG: variant resolution returned null; leaving store.storeId as-is:", store && store.storeId);
    }
  } catch (e) {
    console.warn("variant mapping apply failed:", e);
  }

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
    sendVideoLog({
      userId: uid,
      storeId: store.storeId,
      storeName: store.name,
      prizeType,
      salonId,
      eventSource: "gacha" // これを追加して viewed が skip されないようにする
    })
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
        // PR の事前読み込みを始める前にオーバーレイを表示（ユーザーに読み込み中を明示）
        try { if (loadingOverlay) { loadingOverlay.classList.remove("hidden"); } } catch(e) { if (loadingOverlay) loadingOverlay.style.display = "flex"; }

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
        // PR の再生が始まったのでオーバーレイを隠す
        try { if (loadingOverlay) { loadingOverlay.classList.add("hidden"); } } catch(e) { if (loadingOverlay) loadingOverlay.style.display = "none"; }
        if (prRes && prRes.muted) {
          console.info("prVideo playing muted (user gesture required to enable audio)");
        }
      } catch (err) {
        console.warn("prVideo play failed entirely:", err);
        // 再生できない場合はオーバーレイを隠して直ちにクーポン表示に移行
        try { if (loadingOverlay) { loadingOverlay.classList.add("hidden"); } } catch(e) { if (loadingOverlay) loadingOverlay.style.display = "none"; }
        prVideoContainer.classList.add("hidden");
        openCouponPopupWithLoop(prizeType, store);
      }
    } else {
      console.warn("動画URLが未設定の店舗です");
      try { if (loadingOverlay) { loadingOverlay.classList.add("hidden"); } } catch(e) { if (loadingOverlay) loadingOverlay.style.display = "none"; }
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
      // 再生が始まったので読み込みオーバーレイを隠す
      try { if (loadingOverlay) { loadingOverlay.classList.add("hidden"); } } catch(e) { if (loadingOverlay) loadingOverlay.style.display = "none"; }
      if (res && res.muted) {
        console.info("gachaVideo playing muted (user gesture required to enable audio)");
      }
      // 再生が始まったらそのままスキップボタンは有効（表示済み）
    } catch (err) {
      console.warn("gachaVideo play failed entirely:", err);
      // 再生できない場合はオーバーレイを隠して直接 PR に遷移
      try { if (loadingOverlay) { loadingOverlay.classList.add("hidden"); } } catch(e) { if (loadingOverlay) loadingOverlay.style.display = "none"; }
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

  if (prizeImage) prizeImage.classList.add("hidden");

  // 旧「賞種：〜」行は非表示にしておく（HTMLが残っていても見えないように）
  const typeEl = document.getElementById("coupon-type");
  if (typeEl) typeEl.style.display = "none";

  document.getElementById("coupon-store-name").textContent = store.name;
  const coupon = store.coupon || { discount: 0, conditions: [], expiry: "" };

  const lblMap = { normal: "ノーマル賞", rare: "レア賞", "last-one": "ラストワン賞" };
  const label = lblMap[prizeType] || "";
  const discountEl = document.getElementById("coupon-discount");
  if (discountEl) {
    // 同じ装飾で賞種→改行→金額を表示
    discountEl.innerHTML = (label ? `${label}<br>` : "") + `${coupon.discount}円オフ`;
  }

  const condEl = document.getElementById("coupon-conditions");
  if (condEl) condEl.innerHTML = (coupon.conditions || []).map(c => `<li>${c}</li>`).join("");

  const expiryEl = document.getElementById("coupon-expiry");
  if (expiryEl) expiryEl.textContent = `有効期限：${coupon.expiry}`;

  const loopSrcMap = {
    normal: "videos/coupon-normal.mp4",
    rare: "videos/coupon-rare.mp4",
    "last-one": "videos/coupon-last-one.mp4"
  };
  const loopSrc = loopSrcMap[prizeType] || loopSrcMap.normal;

  (async () => {
    if (loopContainer) loopContainer.classList.remove("hidden");
    try { await preloadVideo(loopVideo, loopSrc, { preload: "metadata", timeout: 3000 }); } catch {}
    try { loopVideo.loop = true; loopVideo.muted = true; loopVideo.currentTime = 0; await loopVideo.play().catch(() => {}); } catch {}
  })();

  couponPopup.classList.remove("hidden");
  try { setupBackButton(); } catch {}
  const backButton = document.getElementById("back-button");
  if (backButton) backButton.classList.remove("hidden");
  updateStatusArea();
}

function addCoupon(store, prizeType) {
  const userId = localStorage.getItem("userId");
  const key = `myCoupons_${userId}`;
  const coupons = JSON.parse(localStorage.getItem(key)) || [];

  // storeId がすでに存在するかチェック
  const alreadyExists = coupons.some(c => c.storeId === store.storeId);
  if (alreadyExists) {
    console.warn("すでにこの店舗のクーポンを所持しています:", store.storeId);
    return;
  }

  // デバッグログ：入力確認
  try {
    console.info("DBG addCoupon called:", {
      storeId: store && store.storeId,
      baseId: store && store.baseId,
      prizeType,
      hasStoreCoupons: !!(store && store.coupons),
      storeCouponsKeys: store && store.coupons ? Object.keys(store.coupons) : null,
      hasStoreCouponField: !!(store && store.coupon)
    });
  } catch (e) {}

  // 1) 優先ソース: 店舗の coupons[prizeType]
  let couponForPrize = null;
  try {
    if (store && store.coupons && prizeType && store.coupons[prizeType]) {
      couponForPrize = JSON.parse(JSON.stringify(store.coupons[prizeType]));
      console.info("DBG addCoupon: using store.coupons for prizeType", prizeType, "storeId", store.storeId);
    } else {
      // 2) 次に baseRestaurantData の該当 base の coupons[prizeType]
      const guessedBaseId = store && (store.baseId || (typeof store.storeId === 'string' ? store.storeId.split('-')[0] : null));
      const base = (window.baseRestaurantData || []).find(b => b.baseId === guessedBaseId);
      if (base && base.coupons && prizeType && base.coupons[prizeType]) {
        couponForPrize = JSON.parse(JSON.stringify(base.coupons[prizeType]));
        console.info("DBG addCoupon: using base.coupons for prizeType", prizeType, "baseId", guessedBaseId, "storeId", store.storeId);
      } else {
        // 3) それでもなければ既存の store.coupon（単体定義）を利用
        if (store && store.coupon) {
          try { couponForPrize = JSON.parse(JSON.stringify(store.coupon)); }
          catch (e) { couponForPrize = store.coupon; }
          console.info("DBG addCoupon: falling back to store.coupon field for storeId", store.storeId);
        }
      }
    }
  } catch (e) {
    console.warn("addCoupon: coupon derive failed:", e);
    couponForPrize = null;
  }

  // 4) 最後に既定値
  if (!couponForPrize) {
    console.warn("store.coupon が未設定のため既定値を使用します:", store && store.storeId);
    couponForPrize = { discount: 0, conditions: [], expiry: "" };
  }

  // coupon の storeId は variant を優先して決定（存在しなければ既存 store.storeId を使う）
  const couponStoreId = (store && (store.variantStoreId || store.storeId)) ? (store.variantStoreId || store.storeId) : (store && store.baseId ? `${store.baseId}-1` : (store && store.storeId ? store.storeId : 'unknown'));

  const newCoupon = {
    storeId: couponStoreId,
    baseId: store && store.baseId ? store.baseId : (couponStoreId && couponStoreId.split ? couponStoreId.split('-')[0] : undefined),
    storeName: store && store.name ? store.name : couponForPrize.storeName || "未設定",
    discount: couponForPrize.discount,
    conditions: couponForPrize.conditions,
    expiry: couponForPrize.expiry,
    type: prizeType,
    used: false
  };

  coupons.push(newCoupon);
  localStorage.setItem(key, JSON.stringify(coupons));

  console.info("DBG addCoupon: pushed newCoupon", newCoupon);

  // snapshot 保存・UI 更新等は従来通り
  try {
    const uid = localStorage.getItem('userId');
    if (typeof saveStateSnapshotNow === 'function') {
      saveStateSnapshotNow(uid).catch(e => console.warn('addCoupon: saveStateSnapshotNow failed', e));
    } else {
      console.warn('addCoupon: saveStateSnapshotNow not available');
    }
  } catch (e) {
    console.warn('addCoupon: snapshot trigger failed', e);
  }

  try {
    const totalAmount = coupons.reduce((sum, c) => sum + (c.discount || 0), 0);
    updateCouponSummary(totalAmount);
  } catch (e) {
    console.warn("updateCouponSummary failed:", e);
  }

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

  try {
    const uid = localStorage.getItem("userId");
    if (uid) {
      const snapshot = {
        coupons: JSON.parse(localStorage.getItem(`myCoupons_${uid}`) || "[]"),
        restaurantData: JSON.parse(localStorage.getItem(`restaurantData_${uid}`) || "[]"),
        gachaState: JSON.parse(localStorage.getItem(`gachaState_${uid}`) || "{}")
      };
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

      // ここに追加：last-one に遷移する分岐でも snapshot を確実に保存
      try {
        if (typeof saveStateSnapshotNow === 'function') {
          saveStateSnapshotNow(userId).catch(e => console.warn('drawPrizeType (last-one): saveStateSnapshotNow failed', e));
        } else {
          console.warn('drawPrizeType (last-one): saveStateSnapshotNow not available');
        }
      } catch (e) {
        console.warn('drawPrizeType (last-one): snapshot trigger failed', e);
      }

      // サーバに保存（既存の呼び出しがあれば残しても安全）
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

  // ここに追加：通常抽選でも snapshot を送る
  try {
    if (typeof saveStateSnapshotNow === 'function') {
      saveStateSnapshotNow(userId).catch(e => console.warn('drawPrizeType: saveStateSnapshotNow failed', e));
    } else {
      console.warn('drawPrizeType: saveStateSnapshotNow not available');
    }
  } catch (e) {
    console.warn('drawPrizeType: snapshot trigger failed', e);
  }

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

  // getRestaurantListForUser 経由で確実に店舗一覧を取得
  const allStores = getRestaurantListForUser(userId) || [];
  const state = JSON.parse(localStorage.getItem(gachaKey)) || { drawnStoreIds: [] };

  // 抽選済みの baseId リスト（storeId の prefix を使って判定）
  const drawnBaseIds = state.drawnStoreIds
    .map(id => (typeof id === 'string' ? id.split('-')[0] : id))
    .filter(Boolean);

  // 賞種で絞らず、未排出の店舗だけを候補にする（賞種は当選時に付与）
  const remainingStores = allStores.filter(store => {
    if (!store) return false;
    const storeBaseId = store.baseId || (typeof store.storeId === 'string' ? store.storeId.split('-')[0] : null);
    return storeBaseId && !drawnBaseIds.includes(storeBaseId);
  });

  if (remainingStores.length === 0) {
    console.warn(`抽選対象の店舗がありません（賞種: ${prizeType}）`);
    return null;
  }

  // last-one は先頭を選ぶ、その他はランダム（既存仕様を維持）
  const selectedStore = prizeType === "last-one"
    ? remainingStores[0]
    : remainingStores[Math.floor(Math.random() * remainingStores.length)];

  // 確実に baseId を持たせる
  try {
    if (selectedStore && !selectedStore.baseId && typeof selectedStore.storeId === 'string') {
      selectedStore.baseId = selectedStore.storeId.split('-')[0];
    }
    // 当選した店舗に prizeType を付与しておく
    selectedStore.prizeType = prizeType;
    // unlock は呼び出し側でやっているためここでは付与だけでも良い
  } catch (e) {
    console.warn("drawStore: post-selection finalize failed", e);
  }

  // 排出記録を保存
  state.drawnStoreIds.push(selectedStore.storeId);
  localStorage.setItem(gachaKey, JSON.stringify(state));

  // サーバへ snapshot 送信は既存の呼び出しを維持
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
  const coupon = store.coupon || { discount: 0, conditions: [], expiry: "" };

  // 旧「賞種：〜」行は非表示
  const typeEl = document.getElementById("coupon-type");
  if (typeEl) typeEl.style.display = "none";

  document.getElementById("coupon-store-name").textContent = store.name;

  const lblMap = { normal: "ノーマル賞", rare: "レア賞", "last-one": "ラストワン賞" };
  const label = lblMap[prizeType] || "";
  const discountEl = document.getElementById("coupon-discount");
  if (discountEl) {
    discountEl.innerHTML = (label ? `${label}<br>` : "") + `${coupon.discount}円オフ`;
  }

  const condEl = document.getElementById("coupon-conditions");
  if (condEl) condEl.innerHTML = (coupon.conditions || []).map(c => `<li>${c}</li>`).join("");
  const expiryEl = document.getElementById("coupon-expiry");
  if (expiryEl) expiryEl.textContent = `有効期限：${coupon.expiry}`;

  couponPopup.classList.remove("hidden");
  if (backButton) backButton.classList.remove("hidden");
  setupBackButton();
  try {
    const uid = localStorage.getItem("userId");
    const totalAmount = (JSON.parse(localStorage.getItem(`myCoupons_${uid}`) || "[]"))
      .reduce((sum, c) => sum + (c.discount || 0), 0);
    updateCouponSummary(totalAmount);
  } catch {}
}

// ７．戻るボタン→ガチャ画面復帰
function updateGachaButtonState() {
  const userId = localStorage.getItem("userId");
  const gachaKey = `gachaState_${userId}`;
  const restaurantKey = `restaurantData_${userId}`;

  const gachaButtonImage = document.getElementById("gacha-button-image");
  // ガチャ要素が無ければ静かに抜ける（正常なケース）
  if (!gachaButtonImage) return;

  const state = JSON.parse(localStorage.getItem(gachaKey));
  const allStores = JSON.parse(localStorage.getItem(restaurantKey) || "[]");

  gachaButtonImage.classList.remove("pulse", "rainbow", "complete");
  gachaButtonImage.onclick = null;

  if (!state) {
    // state が未定義のとき安全処理
    gachaButtonImage.src = "images/gacha-button.png";
    gachaButtonImage.classList.add("zoom");
    gachaButtonImage.onclick = () => startGachaSequence();
    return;
  }

  if (state.remaining === 0) {
    gachaButtonImage.src = "images/gacha-end-button.png";
    gachaButtonImage.classList.add("complete");
    gachaButtonImage.onclick = () => {};
  } else if (state.prizePool && state.prizePool.length === 0) {
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
  console.log('DBG: updateRestaurantData called with', updatedStore && {
    storeId: updatedStore.storeId,
    unlocked: updatedStore.unlocked,
    couponUsed: updatedStore.couponUsed,
    prizeType: updatedStore.prizeType
  });

  const userId = localStorage.getItem("userId");
  const key = `restaurantData_${userId}`;
  const currentData = JSON.parse(localStorage.getItem(key) || "[]");

  const newData = currentData.map(store => {
    if (store.storeId === updatedStore.storeId) {
      // マージ時のルール：
      // - 常に unlocked を true にできる（アンロック操作）
      // - couponUsed は明示的に更新された場合のみ上書き（クーポン使用時のみ）
      const merged = { ...store };
      if (typeof updatedStore.unlocked !== 'undefined') merged.unlocked = updatedStore.unlocked;
      if (typeof updatedStore.couponUsed !== 'undefined') merged.couponUsed = updatedStore.couponUsed;
      // preserve nested coupon unless explicitly provided
      if (updatedStore.coupon) merged.coupon = updatedStore.coupon;
      // preserve other fields if provided
      if (updatedStore.prizeType) merged.prizeType = updatedStore.prizeType;
      console.log('DBG: updateRestaurantData write', { storeId: merged.storeId, unlocked: merged.unlocked, couponUsed: merged.couponUsed });
      return merged;
    }

    // baseId 一致で normal 賞はアンロック（従来の挙動）
    if (store.baseId === updatedStore.baseId && store.prizeType === "normal" && !store.unlocked) {
      return { ...store, unlocked: true };
    }

    return store;
  });

  localStorage.setItem(key, JSON.stringify(newData));
  // UI 更新は外部で行う（必要ならここで明示的に呼ぶ）
}

/* --- 追加: 一元的な state 保存ユーティリティ (debounce + dedupe + flushPromise) --- */
const stateSync = (function () {
  const LOG_URL_FALLBACK = "https://script.google.com/macros/s/AKfycbwk02U0POEPJfGWzmyn2TqzIpyX10-0WyfTKITw6gB8ceJa9vT_U1-EnEzg5vOAVjoU/exec";
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
  const p = Object.assign({ eventType: "viewed", eventSource: "gacha", ts: Date.now() }, payload);
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

// --- applyServerStateToLocal: サーバ状態を安全にローカルへ適用（restaurantsDelta 対応版） ---
function applyServerStateToLocal(payload, userId) {
  if (!payload) {
    console.log('applyServerStateToLocal: empty payload');
    return;
  }

  // doGet の戻りを両対応: { state, updatedAt } または state そのもの
  const serverState = payload.state || payload || {};
  const rootUpdatedAt = payload.updatedAt || serverState.updatedAt || 0;

  if (!userId) userId = localStorage.getItem('userId');
  if (!userId) {
    console.warn('applyServerStateToLocal: no userId');
    return;
  }

  const gachaKey = `gachaState_${userId}`;
  const restaurantKey = `restaurantData_${userId}`;
  const couponsKey = `myCoupons_${userId}`;

  // apply 中は保存系を抑止する
  window.__applyingServerState = true;
  console.log('applyServerStateToLocal: start (updatedAt=%s)', rootUpdatedAt);

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

    // 2) restaurantsDelta（コンパクト差分）の適用
    //    unlockedBaseIds に含まれる baseId の全カードをアンロック（idempotent）
    if (serverState.restaurantsDelta && Array.isArray(serverState.restaurantsDelta.unlockedBaseIds)) {
      const set = new Set(serverState.restaurantsDelta.unlockedBaseIds);
      let changed = false;
      const next = localRestaurants.map(r => {
        if (r && set.has(r.baseId) && !r.unlocked) {
          changed = true;
          return Object.assign({}, r, { unlocked: true });
        }
        return r;
      });
      if (changed) {
        next.updatedAt = Math.max(rootUpdatedAt || 0, Date.now());
        localStorage.setItem(restaurantKey, JSON.stringify(next));
        localRestaurants = next;
        console.log('applyServerStateToLocal: applied restaurantsDelta (unlocked %d baseIds)', set.size);
      }
    }

    // 3) フルの restaurantData が来た場合は updatedAt で上書き判定（基本は delta 優先運用）
    if (Array.isArray(serverState.restaurantData)) {
      const localRestaurantsUpdatedAt = (localRestaurants && localRestaurants.updatedAt) ? localRestaurants.updatedAt : 0;
      if ((rootUpdatedAt || 0) > (localRestaurantsUpdatedAt || 0)) {
        const arr = serverState.restaurantData.slice();
        arr.updatedAt = rootUpdatedAt || Date.now();
        localStorage.setItem(restaurantKey, JSON.stringify(arr));
        localRestaurants = arr;
        console.log('applyServerStateToLocal: replaced restaurantData (count=%d)', arr.length);
      } else {
        console.log('applyServerStateToLocal: skip restaurantData (local newer)');
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
        console.log('applyServerStateToLocal: applied coupons (count=%d)', nextCoupons.length);
      } else {
        console.log('applyServerStateToLocal: skip coupons (local newer)');
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
        console.log('applyServerStateToLocal: applied gachaState (updatedAt=%s)', merged.updatedAt);
      } else {
        console.log('applyServerStateToLocal: skip gachaState (local newer)');
      }
    }

    // 6) UI 反映
    try { typeof updateStatusArea === 'function' && updateStatusArea(); } catch (e) { /* noop */ }
    try { typeof renderRestaurants === 'function' && renderRestaurants(); } catch (e) { /* noop */ }
  } catch (err) {
    console.error('applyServerStateToLocal: error', err);
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

// --- START: snapshot helper + guaranteed save calls (追加) ---

// buildSnapshot をグローバルに公開して簡単に手動送信できるようにする
function buildSnapshotForUser(userId) {
  userId = userId || localStorage.getItem('userId');
  if (!userId) return { coupons: [], restaurantData: [], gachaState: {} };

  // try per-user keys first, then legacy keys as fallback
  const couponsKeys = [
    `myCoupons_${userId}`,
    'myCoupons',
  ];
  const restaurantsKeys = [
    `restaurantData_${userId}`,
    'restaurantData'
  ];
  const gachaKeys = [
    `gachaState_${userId}`,
    'gachaState'
  ];

  let coupons = [];
  for (const k of couponsKeys) {
    try { const v = localStorage.getItem(k); if (v) { coupons = JSON.parse(v); break; } } catch(e){}
  }

  let restaurantData = [];
  for (const k of restaurantsKeys) {
    try { const v = localStorage.getItem(k); if (v) { restaurantData = JSON.parse(v); break; } } catch(e){}
  }

  let gachaState = {};
  for (const k of gachaKeys) {
    try { const v = localStorage.getItem(k); if (v) { gachaState = JSON.parse(v); break; } } catch(e){}
  }

  return { coupons, restaurantData, gachaState };
}
window.buildSnapshotForUser = buildSnapshotForUser; // for manual testing

// wrapper to request save and log what we send (helps debugging)
function saveStateSnapshotNow(userId) {
  try {
    const snapshot = buildSnapshotForUser(userId);
    snapshot.updatedAt = Date.now();
    if (!snapshot.state) snapshot.state = {};
    snapshot.state.gachaState = snapshot.state.gachaState || {};
    snapshot.state.gachaState.updatedAt = snapshot.state.gachaState.updatedAt || snapshot.updatedAt;
    // mark userId for queued-flush logic
    snapshot.userId = userId;
    console.log('⤴️ saveStateSnapshotNow: snapshot ->', snapshot);
    return requestSaveSnapshotSafe(snapshot, true);
  } catch (e) {
    console.error('saveStateSnapshotNow error', e);
    return Promise.reject(e);
  }
}
window.saveStateSnapshotNow = saveStateSnapshotNow;

// --- END: snapshot helper + guaranteed save calls ---


