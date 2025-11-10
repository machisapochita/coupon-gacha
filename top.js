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

  function onLogin(userId) {
    localStorage.setItem("userId", userId);
    // サーバから state を取得してマージ
    loadGachaStateFromServer(userId).then(res => {
      if (res && res.status === "OK" && res.found) {
        mergeAndApplyState(res.state || {});
        // 画面遷移等を続行
        window.location.href = "gacha.html";
      } else {
        window.location.href = "gacha.html";
      }
    }).catch(err => {
      console.warn("load state failed:", err);
      window.location.href = "gacha.html";
    });
  }
});