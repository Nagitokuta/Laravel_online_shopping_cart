document.addEventListener("DOMContentLoaded", () => {
    const cartEmptyElement = document.getElementById("cart-empty");
    const cartContentElement = document.getElementById("cart-content");
    const cartItemsElement = document.getElementById("cart-items");
    const totalAmountElement = document.getElementById("total-amount");

    // カート変更時の処理
    window.addEventListener("cartChanged", () => {
        renderCartPage();
    });

    // カートローディング状態変更時の処理
    window.addEventListener("cartLoadingChanged", (event) => {
        updateLoadingState(event.detail.isLoading);
    });

    // ローディング状態を更新
    function updateLoadingState(isLoading) {
        const buttons = document.querySelectorAll("button");
        buttons.forEach((button) => {
            button.disabled = isLoading;
        });
    }

    // カート画面の表示を更新
    function renderCartPage() {
        const cartItems = window.cart.getItems();

        if (cartItems.length === 0) {
            // カートが空の場合
            cartEmptyElement.style.display = "block";
            cartContentElement.style.display = "none";
        } else {
            // カートに商品がある場合
            cartEmptyElement.style.display = "none";
            cartContentElement.style.display = "block";
            renderCartItems(cartItems);
            updateTotalAmount();
        }
    }

    // カート内商品をテーブルに表示
    function renderCartItems(items) {
        cartItemsElement.innerHTML = "";

        items.forEach((item) => {
            const tr = document.createElement("tr");

            // 商品名
            const tdName = document.createElement("td");
            tdName.className = "product-name";
            tdName.textContent = item.name;
            tr.appendChild(tdName);

            // 価格
            const tdPrice = document.createElement("td");
            tdPrice.className = "product-price";
            tdPrice.textContent = `¥${item.price.toLocaleString()}`;
            tr.appendChild(tdPrice);

            // 数量コントロール
            const tdQuantity = document.createElement("td");
            tdQuantity.innerHTML = createQuantityControls(item);
            tr.appendChild(tdQuantity);

            // 小計
            const tdSubtotal = document.createElement("td");
            tdSubtotal.className = "subtotal";
            tdSubtotal.textContent = `¥${item.subtotal.toLocaleString()}`;
            tr.appendChild(tdSubtotal);

            // 削除ボタン
            const tdRemove = document.createElement("td");
            const removeBtn = document.createElement("button");
            removeBtn.className = "remove-btn";
            removeBtn.textContent = "削除";
            removeBtn.addEventListener("click", () => {
                removeItem(item.id);
            });
            tdRemove.appendChild(removeBtn);
            tr.appendChild(tdRemove);

            cartItemsElement.appendChild(tr);
        });
    }

    // 数量コントロールのHTMLを生成
    function createQuantityControls(item) {
        return `
      <div class="quantity-controls">
        <button class="quantity-btn" onclick="decreaseQuantity(${item.id})">-</button>
        <input type="number" class="quantity-input" value="${item.quantity}" 
               min="1" onchange="updateQuantity(${item.id}, this.value)">
        <button class="quantity-btn" onclick="increaseQuantity(${item.id})">+</button>
      </div>
    `;
    }

    // 合計金額を更新
    function updateTotalAmount() {
        const total = window.cart.getTotalPrice();
        totalAmountElement.textContent = `¥${total.toLocaleString()}`;
    }

    // 商品削除
    async function removeItem(cartItemId) {
        if (confirm("この商品をカートから削除しますか？")) {
            const result = await window.cart.removeItem(cartItemId);
            if (!result.success) {
                alert(result.error);
            }
        }
    }

    // グローバル関数として定義（HTMLから呼び出すため）
    window.increaseQuantity = async function (cartItemId) {
        const item = window.cart
            .getItems()
            .find((item) => item.id === cartItemId);
        if (item) {
            const result = await window.cart.updateQuantity(
                cartItemId,
                item.quantity + 1
            );
            if (!result.success) {
                alert(result.error);
            }
        }
    };

    window.decreaseQuantity = async function (cartItemId) {
        const item = window.cart
            .getItems()
            .find((item) => item.id === cartItemId);
        if (item && item.quantity > 1) {
            const result = await window.cart.updateQuantity(
                cartItemId,
                item.quantity - 1
            );
            if (!result.success) {
                alert(result.error);
            }
        }
    };

    window.updateQuantity = async function (cartItemId, newQuantity) {
        const quantity = parseInt(newQuantity);
        if (quantity > 0) {
            const result = await window.cart.updateQuantity(
                cartItemId,
                quantity
            );
            if (!result.success) {
                alert(result.error);
            }
        }
    };

    // イベントリスナー
    document
        .getElementById("back-to-products")
        .addEventListener("click", () => {
            window.location.href = "index.html";
        });

    document
        .getElementById("clear-cart")
        .addEventListener("click", async () => {
            if (confirm("カートを空にしますか？この操作は取り消せません。")) {
                const result = await window.cart.clear();
                if (!result.success) {
                    alert(result.error);
                }
            }
        });

    document
        .getElementById("proceed-checkout")
        .addEventListener("click", () => {
            if (window.cart.getItems().length === 0) {
                alert("カートが空です。商品を追加してください。");
                return;
            }
            // 購入手続き画面への遷移（次のステップで実装）
            window.location.href = "checkout.html";
        });

    // 初期表示
    renderCartPage();
});
