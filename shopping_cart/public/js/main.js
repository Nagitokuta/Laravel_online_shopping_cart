document.addEventListener("DOMContentLoaded", () => {
    const API_URL = "http://localhost:8000/api/products";
    const loadingElement = document.getElementById("loading");
    const productTable = document.getElementById("product-table");
    const productList = document.getElementById("product-list");

    // カート変更時の処理
    window.addEventListener("cartChanged", (event) => {
        updateCartButton(event.detail.totalItems);
    });

    // カートローディング状態変更時の処理
    window.addEventListener("cartLoadingChanged", (event) => {
        updateLoadingState(event.detail.isLoading);
    });

    // カートボタンの表示を更新
    function updateCartButton(totalItems) {
        const cartBtn = document.getElementById("cart-btn");
        if (totalItems > 0) {
            cartBtn.textContent = `カートを見る (${totalItems})`;
        } else {
            cartBtn.textContent = "カートを見る";
        }
    }

    // ローディング状態を更新
    function updateLoadingState(isLoading) {
        const cartBtn = document.getElementById("cart-btn");
        if (isLoading) {
            cartBtn.disabled = true;
            cartBtn.textContent = "処理中...";
        } else {
            cartBtn.disabled = false;
            updateCartButton(window.cart.getTotalItems());
        }
    }

    // 商品一覧を取得してテーブルに表示する関数
    async function fetchAndDisplayProducts() {
        try {
            loadingElement.style.display = "block";
            productTable.style.display = "none";

            const response = await fetch(API_URL);

            if (!response.ok) {
                throw new Error(`サーバーエラー: ${response.status}`);
            }

            const products = await response.json();
            renderProductTable(products);

            loadingElement.style.display = "none";
            productTable.style.display = "table";
        } catch (error) {
            console.error("商品一覧の取得に失敗:", error);
            loadingElement.textContent = "商品一覧の取得に失敗しました。";
        }
    }

    // 在庫状況に応じたクラス名を取得
    function getStockClass(stock) {
        if (stock <= 0) {
            return "stock out-of-stock";
        } else if (stock <= 5) {
            return "stock low-stock";
        } else {
            return "stock in-stock";
        }
    }

    // 在庫状況に応じた表示テキストを取得
    function getStockText(stock) {
        if (stock <= 0) {
            return "在庫切れ";
        } else if (stock <= 5) {
            return `残り${stock}個`;
        } else {
            return stock;
        }
    }

    // 商品一覧をテーブルに表示する関数
    function renderProductTable(products) {
        productList.innerHTML = "";

        if (products.length === 0) {
            const tr = document.createElement("tr");
            tr.innerHTML = '<td colspan="4">商品がありません</td>';
            productList.appendChild(tr);
            return;
        }

        products.forEach((product) => {
            const tr = document.createElement("tr");

            // 商品名
            const tdName = document.createElement("td");
            tdName.textContent = product.name;
            tr.appendChild(tdName);

            // 価格
            const tdPrice = document.createElement("td");
            tdPrice.className = "price";
            tdPrice.textContent = `¥${product.price.toLocaleString()}`;
            tr.appendChild(tdPrice);

            // 在庫（強化版）
            const tdStock = document.createElement("td");
            tdStock.className = getStockClass(product.stock);
            tdStock.textContent = getStockText(product.stock);
            tr.appendChild(tdStock);

            // カートに追加ボタン
            const tdAdd = document.createElement("td");
            const addButton = document.createElement("button");
            addButton.className = "add-to-cart";

            if (product.stock <= 0) {
                addButton.textContent = "在庫切れ";
                addButton.disabled = true;
                addButton.classList.add("out-of-stock");
            } else {
                addButton.textContent = "追加";
                addButton.disabled = false;

                // ボタンクリック時の処理
                addButton.addEventListener("click", () => {
                    addToCart(product, addButton);
                });
            }

            tdAdd.appendChild(addButton);
            tr.appendChild(tdAdd);

            productList.appendChild(tr);
        });
    }

    // カートに追加する関数（エラーハンドリング強化版）
    async function addToCart(product, button) {
        // ボタンを無効化
        button.disabled = true;
        const originalText = button.textContent;
        button.textContent = "追加中...";

        try {
            // サーバーAPIでカートに追加
            const result = await window.cart.addItem(product, 1);

            if (result.success) {
                // 成功メッセージ
                showMessage(
                    `${product.name}をカートに追加しました！`,
                    "success"
                );

                // ボタンのフィードバック
                button.textContent = "追加済み";
                setTimeout(() => {
                    button.textContent = originalText;
                    button.disabled = product.stock === 0;
                }, 1000);
            } else {
                // エラーメッセージ
                showMessage(result.error, "error");
                button.textContent = originalText;
                button.disabled = product.stock === 0;

                // 在庫不足の場合は商品一覧を再読み込み
                if (result.error.includes("在庫")) {
                    setTimeout(() => {
                        fetchAndDisplayProducts();
                    }, 2000);
                }
            }
        } catch (error) {
            console.error("カートへの追加でエラー:", error);
            showMessage("カートへの追加に失敗しました", "error");
            button.textContent = originalText;
            button.disabled = product.stock === 0;
        }
    }

    // メッセージ表示関数
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
    }

    // ボタンのイベントリスナー
    document.getElementById("cart-btn").addEventListener("click", () => {
        window.location.href = "cart.html";
    });

    // 初期表示
    fetchAndDisplayProducts();
});
