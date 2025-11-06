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
});