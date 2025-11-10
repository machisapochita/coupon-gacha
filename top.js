document.addEventListener("DOMContentLoaded", () => {
  const logoutBtn = document.getElementById("logout-button");

  logoutBtn.addEventListener("click", () => {
    // ✅ 正しいキー名でログイン情報を削除
    localStorage.removeItem("userId");

    // ✅ 必要なら他の状態もクリア（任意）
    // localStorage.clear(); ← 全削除する場合

    // ✅ ログインページへ遷移
    window.location.href = "index.html";
  });

  /**
   * サーバから状態を取得してローカルにマージする（ログイン直後に呼ぶ）
   * - userId: ログインしたユーザID
   * - timeoutMs: サーバ応答を待つ時間（デフォルト 3000ms）
   */
  function syncAfterLogin(userId, timeoutMs = 3000) {
    if (!userId) return Promise.resolve({ skipped: true, reason: "no userId" });

    const LOG_URL_FALLBACK = "https://script.google.com/macros/s/AKfycbyeXtfLCqsp3aH6V2h7phVw14MRF803iprYx1aPgL6t8wX0Zfkok4xt6KmG4pusz2Hg/exec";
    const baseUrl = (window.LOG_URL || LOG_URL_FALLBACK);
    const url = baseUrl + "?action=getState&userId=" + encodeURIComponent(userId);

    // fetch with timeout
    const fetchPromise = fetch(url, { method: "GET" }).then(r => r.text()).then(txt => {
      try { return JSON.parse(txt); } catch (e) { return { status: "parse-error", raw: txt }; }
    });

    const timeoutPromise = new Promise((res) => setTimeout(() => res({ status: "timeout" }), timeoutMs));

    return Promise.race([fetchPromise, timeoutPromise]).then(resp => {
      if (!resp || resp.status !== "OK" || !resp.found || !resp.state) {
        console.info("no server state or fetch skipped:", resp);
        return resp;
      }

      try {
        const state = resp.state || {};
        const couponsKey = `myCoupons_${userId}`;
        const restaurantsKey = `restaurantData_${userId}`;
        const gachaKey = `gachaState_${userId}`;

        // ローカルに無ければサーバ側を採用する単純マージ（要件により変更可）
        const localCoupons = JSON.parse(localStorage.getItem(couponsKey) || "null");
        if ((!localCoupons || localCoupons.length === 0) && state.coupons) {
          localStorage.setItem(couponsKey, JSON.stringify(state.coupons));
        }

        const localRestaurants = JSON.parse(localStorage.getItem(restaurantsKey) || "null");
        if ((!localRestaurants || localRestaurants.length === 0) && state.restaurantData) {
          localStorage.setItem(restaurantsKey, JSON.stringify(state.restaurantData));
        }

        const localGacha = JSON.parse(localStorage.getItem(gachaKey) || "null");
        if ((!localGacha || Object.keys(localGacha).length === 0) && state.gachaState) {
          localStorage.setItem(gachaKey, JSON.stringify(state.gachaState));
        }

        console.log("server state merged for user:", userId);
        return { status: "merged", state: state };
      } catch (e) {
        console.warn("syncAfterLogin merge failed:", e);
        return { status: "error", error: String(e) };
      }
    }).catch(err => {
      console.warn("syncAfterLogin fetch error:", err);
      return { status: "error", error: String(err) };
    });
  }

  // 例: 既存のログイン成功ハンドラに組み込む（onLogin の代わりに呼ぶ）
  function onLoginSuccess(userId) {
    localStorage.setItem("userId", userId);

    // サーバ状態取得を短時間待ってマージしてから画面遷移する（非同期で即遷移しても可）
    syncAfterLogin(userId, 3000).then(() => {
      // マージ後の画面遷移（必要に応じ gacha.html や top.html へ）
      window.location.href = "gacha.html";
    }).catch(() => {
      window.location.href = "gacha.html";
    });
  }
});