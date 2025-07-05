// 共通エラーハンドリング
function handleApiError(error, defaultMessage = "エラーが発生しました") {
    console.error("API Error:", error);

    let message = defaultMessage;
    if (error.message) {
        message = error.message;
    }

    showMessage(message, "error");
}

// 共通メッセージ表示
function showMessage(message, type = "success") {
    // 既存のメッセージがあれば削除
    const existingMessage = document.querySelector(".message");
    if (existingMessage) {
        existingMessage.remove();
    }

    // メッセージ要素を作成
    const messageDiv = document.createElement("div");
    messageDiv.className = "message";
    messageDiv.textContent = message;

    const backgroundColor = type === "success" ? "#28a745" : "#dc3545";
    messageDiv.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background: ${backgroundColor};
    color: white;
    padding: 1rem;
    border-radius: 4px;
    box-shadow: 0 2px 8px rgba(0,0,0,0.2);
    z-index: 1000;
    max-width: 300px;
  `;

    document.body.appendChild(messageDiv);

    // 3秒後に自動削除
    setTimeout(() => {
        messageDiv.remove();
    }, 3000);
}E
