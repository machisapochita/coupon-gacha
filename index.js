document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("login-form");
  const input = document.getElementById("login-number");
  const successMsg = document.getElementById("success-message");
  const errorMsg = document.getElementById("error-message");

  // URLパラメータから uid を取得して自動入力
  const params = new URLSearchParams(window.location.search);
  const uid = params.get("uid");
  if (uid) input.value = uid;

  // ログイン状態がすでにある場合は top.html にリダイレクト
  const loggedInId = localStorage.getItem("userId");
  if (loggedInId) {
    window.location.href = "top.html";
    return;
  }

  // ログイン後にサーバー状態を取得する関数
  async function loadUserStateAfterLogin(userId) {
    try {
      // gacha.js の関数を利用（既に定義済み）
      if (typeof window.loadGachaStateFromServer === 'function' && 
          typeof window.applyServerStateToLocal === 'function') {
        
        console.log('Loading server state for user:', userId);
        const res = await window.loadGachaStateFromServer(userId);
        
        if (res && (res.status === 'ok' || res.status === 'OK') && res.state) {
          window.applyServerStateToLocal(res, userId);
          console.log('Server state applied successfully');
        } else {
          console.log('No server state found or empty response');
        }
      } else {
        console.warn('State loading functions not available');
      }
    } catch (e) {
      console.warn('Failed to load user state:', e);
    }
  }

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const enteredId = input.value.trim();

    // メッセージを一旦非表示
    successMsg.classList.add("hidden");
    errorMsg.classList.add("hidden");

    try {
      const response = await fetch("validIds.json");
      const data = await response.json();
      const validIds = data.users.map(user => user.id);

      if (validIds.includes(enteredId)) {
        // ログイン成功 → localStorageに保存
        const matchedUser = data.users.find(user => user.id === enteredId);
        if (matchedUser) {
        localStorage.setItem("userId", matchedUser.id);
        localStorage.setItem("salonId", matchedUser.salonId);

        // --- 読み込みオーバーレイを表示（存在しなければ生成） ---
        let loadingOverlay = document.getElementById("loading-overlay");
        try {
          if (!loadingOverlay && typeof document !== "undefined") {
            loadingOverlay = document.createElement("div");
            loadingOverlay.id = "loading-overlay";
            loadingOverlay.className = "loading-overlay hidden";
            const img = document.createElement("img");
            img.src = "images/login-check.png";
            img.alt = "読み込み中...";
            img.className = "loading-image";
            loadingOverlay.appendChild(img);
            try { document.body.appendChild(loadingOverlay); } catch(e) {}
          }
          if (loadingOverlay) {
            try { document.body.appendChild(loadingOverlay); } catch(e) {}
            try { loadingOverlay.style.zIndex = "99999"; } catch(e) {}
            try { loadingOverlay.classList.remove("hidden"); } catch(e) { loadingOverlay.style.display = "flex"; }
          }
        } catch(e) {
          console.warn("show login loadingOverlay failed:", e);
        }

        // ログイン直後にサーバー状態を取得・適用（読み込み中表示のまま待つ）
        try {
          await loadUserStateAfterLogin(matchedUser.id);
        } catch (e) {
          console.warn("loadUserStateAfterLogin failed:", e);
        } finally {
          // 読み込みオーバーレイを隠す
          try { if (loadingOverlay) { loadingOverlay.classList.add("hidden"); } } catch (e) { if (loadingOverlay) loadingOverlay.style.display = "none"; }
        }
      }
      successMsg.classList.remove("hidden");

        setTimeout(() => {
          window.location.href = "top.html";
        }, 1000);
      } else {
        errorMsg.classList.remove("hidden");
      }
    } catch (error) {
      console.error("ID照合エラー:", error);
      errorMsg.textContent = "ログインIDに誤りがあります";
      errorMsg.classList.remove("hidden");
    }
  });
});