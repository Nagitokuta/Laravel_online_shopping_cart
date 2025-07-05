document.addEventListener("DOMContentLoaded", () => {
    const loadingElement = document.getElementById("loading");
    const errorElement = document.getElementById("error-message");
    const orderDetailsElement = document.getElementById("order-details");

    // URLパラメータから注文番号を取得
    function getOrderNumberFromURL() {
        const urlParams = new URLSearchParams(window.location.search);
        return urlParams.get("order");
    }

    // ローカルストレージから注文データを取得
    function getOrderDataFromStorage() {
        const orderData = localStorage.getItem("orderData");
        return orderData ? JSON.parse(orderData) : null;
    }

    // 注文詳細をサーバーから取得
    async function fetchOrderDetails(orderNumber) {
        try {
            const response = await fetch(
                `http://localhost:8000/api/orders/${orderNumber}`,
                {
                    method: "GET",
                    credentials: "include",
                    headers: {
                        Accept: "application/json",
                        "Content-Type": "application/json",
                    },
                }
            );

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            return { success: true, order: data.order };
        } catch (error) {
            console.error("注文詳細の取得に失敗:", error);
            return { success: false, error: error.message };
        }
    }

    // 注文情報を画面に表示
    function displayOrderDetails(order) {
        // 基本情報の表示
        document.getElementById("order-number").textContent =
            order.order_number;
        document.getElementById("order-date").textContent = formatDate(
            order.created_at
        );
        document.getElementById("customer-name").textContent =
            order.customer_name;
        document.getElementById("delivery-address").textContent = order.address;
        document.getElementById("phone-number").textContent = order.phone;

        // 購入商品の表示
        const itemsList = document.getElementById("items-list");
        itemsList.innerHTML = "";

        if (order.items && order.items.length > 0) {
            order.items.forEach((item) => {
                const orderItemDiv = document.createElement("div");
                orderItemDiv.className = "order-item";

                orderItemDiv.innerHTML = `
          <div class="item-info">
            <div class="item-name">${item.product_name}</div>
            <div class="item-details">¥${item.price.toLocaleString()} × ${
                    item.quantity
                }個</div>
          </div>
          <div class="item-subtotal">¥${item.subtotal.toLocaleString()}</div>
        `;

                itemsList.appendChild(orderItemDiv);
            });
        }

        // 合計金額の表示
        document.getElementById(
            "total-amount"
        ).textContent = `¥${order.total_amount.toLocaleString()}`;

        // 注文データをローカルストレージから削除（セキュリティのため）
        localStorage.removeItem("orderData");
    }

    // 日付をフォーマット
    function formatDate(dateString) {
        const date = new Date(dateString);
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, "0");
        const day = String(date.getDate()).padStart(2, "0");
        const hours = String(date.getHours()).padStart(2, "0");
        const minutes = String(date.getMinutes()).padStart(2, "0");

        return `${year}年${month}月${day}日 ${hours}:${minutes}`;
    }

    // エラー表示
    function showError() {
        loadingElement.style.display = "none";
        orderDetailsElement.style.display = "none";
        errorElement.style.display = "block";
    }

    // 成功表示
    function showOrderDetails() {
        loadingElement.style.display = "none";
        errorElement.style.display = "none";
        orderDetailsElement.style.display = "block";
    }

    // メイン処理
    async function initializeCompletePage() {
        try {
            // URLパラメータから注文番号を取得
            const orderNumber = getOrderNumberFromURL();

            if (orderNumber) {
                // サーバーから注文詳細を取得
                const result = await fetchOrderDetails(orderNumber);

                if (result.success) {
                    displayOrderDetails(result.order);
                    showOrderDetails();
                } else {
                    showError();
                }
            } else {
                // URLパラメータがない場合はローカルストレージから取得を試行
                const orderData = getOrderDataFromStorage();

                if (orderData) {
                    // ローカルストレージのデータを使用（フォールバック）
                    displayOrderDetails(orderData);
                    showOrderDetails();
                } else {
                    showError();
                }
            }
        } catch (error) {
            console.error("購入完了画面の初期化に失敗:", error);
            showError();
        }
    }

    // 購入完了メール送信（概念的実装）
    function sendConfirmationEmail(orderData) {
        // 実際の実装では、サーバーサイドでメール送信処理を行う
        console.log("購入完了メールを送信:", orderData);

        // 今回は概念的な実装として、コンソールにログを出力
        // 実際のプロジェクトでは以下のような処理を行う：
        // 1. サーバーサイドのメール送信APIを呼び出し
        // 2. メールテンプレートに注文情報を埋め込み
        // 3. 顧客のメールアドレスに送信
    }

    // 初期化実行
    initializeCompletePage();
});
