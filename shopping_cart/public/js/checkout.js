document.addEventListener("DOMContentLoaded", () => {
    const loadingCartElement = document.getElementById("loading-cart");
    const cartSummaryElement = document.getElementById("cart-summary");
    const emptyCartElement = document.getElementById("empty-cart");
    const cartItemsListElement = document.getElementById("cart-items-list");
    const totalAmountElement = document.getElementById("total-amount");
    const checkoutForm = document.getElementById("checkout-form");

    // カート変更時の処理
    window.addEventListener("cartChanged", () => {
        displayCartSummary();
    });

    // カート内容を表示
    function displayCartSummary() {
        const cartItems = window.cart.getItems();

        if (cartItems.length === 0) {
            loadingCartElement.style.display = "none";
            cartSummaryElement.style.display = "none";
            emptyCartElement.style.display = "block";
            document.getElementById("confirm-purchase").disabled = true;
        } else {
            loadingCartElement.style.display = "none";
            emptyCartElement.style.display = "none";
            cartSummaryElement.style.display = "block";
            renderCartItems(cartItems);
            updateTotalAmount();
            document.getElementById("confirm-purchase").disabled = false;
        }
    }

    // カート内商品を表示
    function renderCartItems(items) {
        cartItemsListElement.innerHTML = "";

        items.forEach((item) => {
            const cartItemDiv = document.createElement("div");
            cartItemDiv.className = "cart-item";

            cartItemDiv.innerHTML = `
        <div class="item-info">
          <div class="item-name">${item.name}</div>
          <div class="item-details">¥${item.price.toLocaleString()} × ${
                item.quantity
            }</div>
        </div>
        <div class="item-subtotal">¥${item.subtotal.toLocaleString()}</div>
      `;

            cartItemsListElement.appendChild(cartItemDiv);
        });
    }

    // 合計金額を更新
    function updateTotalAmount() {
        const total = window.cart.getTotalPrice();
        totalAmountElement.textContent = `¥${total.toLocaleString()}`;
    }

    // フォームバリデーション
    function validateForm() {
        let isValid = true;
        clearErrorMessages();

        const name = document.getElementById("name").value.trim();
        if (!name) {
            showError("name", "氏名は必須です");
            isValid = false;
        } else if (name.length < 2) {
            showError("name", "氏名は2文字以上で入力してください");
            isValid = false;
        }

        const address = document.getElementById("address").value.trim();
        if (!address) {
            showError("address", "配送先住所は必須です");
            isValid = false;
        } else if (address.length < 10) {
            showError("address", "住所は10文字以上で入力してください");
            isValid = false;
        }

        const phone = document.getElementById("phone").value.trim();
        const phoneRegex = /^[0-9-]{10,15}$/;
        if (!phone) {
            showError("phone", "電話番号は必須です");
            isValid = false;
        } else if (!phoneRegex.test(phone)) {
            showError(
                "phone",
                "正しい電話番号を入力してください（例：090-1234-5678）"
            );
            isValid = false;
        }

        return isValid;
    }

    // エラーメッセージを表示
    function showError(fieldName, message) {
        const errorElement = document.getElementById(`${fieldName}-error`);
        const inputElement = document.getElementById(fieldName);

        errorElement.textContent = message;
        inputElement.classList.add("error");
    }

    // エラーメッセージをクリア
    function clearErrorMessages() {
        const errorElements = document.querySelectorAll(".error-message");
        const inputElements = document.querySelectorAll(".form-group input");

        errorElements.forEach((element) => {
            element.textContent = "";
        });

        inputElements.forEach((element) => {
            element.classList.remove("error");
        });
    }

    // 購入処理をサーバーに送信
    async function submitOrder() {
        const orderData = {
            customer_name: document.getElementById("name").value.trim(),
            address: document.getElementById("address").value.trim(),
            phone: document.getElementById("phone").value.trim(),
        };

        try {
            const response = await fetch("http://localhost:8000/api/orders", {
                method: "POST",
                credentials: "include",
                headers: {
                    Accept: "application/json",
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(orderData),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || "注文の作成に失敗しました");
            }

            // 注文情報をローカルストレージに保存
            localStorage.setItem("orderData", JSON.stringify(data.order));

            return { success: true, order: data.order };
        } catch (error) {
            console.error("注文作成エラー:", error);
            return { success: false, error: error.message };
        }
    }

    // メッセージ表示
    function showMessage(message, type = "success") {
        const existingMessage = document.querySelector(".message");
        if (existingMessage) {
            existingMessage.remove();
        }

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

        setTimeout(() => {
            messageDiv.remove();
        }, 3000);
    }

    // イベントリスナー
    document.getElementById("back-to-cart").addEventListener("click", () => {
        window.location.href = "cart.html";
    });

    document
        .getElementById("confirm-purchase")
        .addEventListener("click", async () => {
            // フォームバリデーション
            if (!validateForm()) {
                showMessage(
                    "入力内容に誤りがあります。確認してください。",
                    "error"
                );
                return;
            }

            // カートが空でないかチェック
            if (window.cart.getItems().length === 0) {
                showMessage(
                    "カートが空です。商品を追加してください。",
                    "error"
                );
                return;
            }

            // ボタンを無効化
            const confirmButton = document.getElementById("confirm-purchase");
            confirmButton.disabled = true;
            confirmButton.textContent = "処理中...";

            try {
                // 購入処理を実行
                const result = await submitOrder();

                if (result.success) {
                    showMessage("注文が正常に作成されました！", "success");

                    // カート情報を更新
                    await window.cart.loadFromServer();

                    // 購入完了画面へ遷移（注文番号をパラメータとして渡す）
                    setTimeout(() => {
                        window.location.href = `complete.html?order=${result.order.order_number}`;
                    }, 1000);
                } else {
                    showMessage(result.error, "error");
                    confirmButton.disabled = false;
                    confirmButton.textContent = "購入確定";
                }
            } catch (error) {
                console.error("購入処理エラー:", error);
                showMessage("購入処理中にエラーが発生しました", "error");
                confirmButton.disabled = false;
                confirmButton.textContent = "購入確定";
            }
        });

    // 初期表示
    displayCartSummary();
});
