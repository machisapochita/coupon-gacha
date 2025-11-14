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

    const LOG_URL_FALLBACK = "https://script.google.com/macros/s/AKfycby1AJAK75hLO3VqlCdoweSVcEEH7HAWMVUbmljLMUl1WSFuVO6FevsEXfJJcqT4TMgD/exec";
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

        // ---------- サーバ優先ルール ----------
        // サーバにある値でローカルを上書きする（存在するかは問わない）
        if (state.coupons) {
          localStorage.setItem(couponsKey, JSON.stringify(state.coupons));
        } else {
          // サーバになければローカルはクリアしない（必要ならここで localStorage.removeItem を行う）
        }

        if (state.restaurantData) {
          localStorage.setItem(restaurantsKey, JSON.stringify(state.restaurantData));
        }

        if (state.gachaState) {
          localStorage.setItem(gachaKey, JSON.stringify(state.gachaState));
        }

        console.log("server state applied (overwrite) for user:", userId);
        return { status: "applied", state: state };
      } catch (e) {
        console.warn("syncAfterLogin apply failed:", e);
        return { status: "error", error: String(e) };
      }
    }).catch(err => {
      console.warn("syncAfterLogin fetch error:", err);
      return { status: "error", error: String(err) };
    });
  }

  // 既存のログイン成功ハンドラに組み込む
  function onLoginSuccess(userId) {
    localStorage.setItem("userId", userId);

    // サーバ状態を優先して上書きしてから遷移（タイムアウト後は遷移）
    syncAfterLogin(userId, 3000).then(() => {
      window.location.href = "gacha.html";
    }).catch(() => {
      window.location.href = "gacha.html";
    });
  }
});