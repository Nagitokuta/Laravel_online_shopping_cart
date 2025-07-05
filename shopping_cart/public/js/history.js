document.addEventListener("DOMContentLoaded", () => {
    const loadingElement = document.getElementById("loading");
    const errorElement = document.getElementById("error-message");
    const noHistoryElement = document.getElementById("no-history");
    const historyContentElement = document.getElementById("history-content");
    const historyListElement = document.getElementById("history-list");
    const paginationElement = document.getElementById("pagination");
    const totalCountElement = document.getElementById("total-count");

    let currentPage = 1;
    let currentFilters = {};

    // 購入履歴を取得
    async function fetchOrderHistory(page = 1, filters = {}) {
        try {
            const params = new URLSearchParams({
                page: page,
                per_page: 10,
                ...filters,
            });

            const response = await fetch(
                `http://localhost:8000/api/orders?${params}`,
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
            return { success: true, data };
        } catch (error) {
            console.error("購入履歴の取得に失敗:", error);
            return { success: false, error: error.message };
        }
    }

    // 購入履歴を表示
    function displayOrderHistory(orders, pagination) {
        historyListElement.innerHTML = "";

        if (orders.length === 0) {
            showNoHistory();
            return;
        }

        orders.forEach((order) => {
            const historyItem = createHistoryItem(order);
            historyListElement.appendChild(historyItem);
        });

        // 合計件数を更新
        totalCountElement.textContent = pagination.total;

        // ページネーションを表示
        displayPagination(pagination);
        showHistoryContent();
    }

    // 履歴アイテムを作成
    function createHistoryItem(order) {
        const historyItem = document.createElement("div");
        historyItem.className = "history-item";
        historyItem.addEventListener("click", () => {
            window.location.href = `complete.html?order=${order.order_number}`;
        });

        // ステータスに応じたクラス名を取得
        const statusClass = `status-${order.status}`;
        const statusText = getStatusText(order.status);

        // 顧客名からセッションIDを除去
        const customerName = order.customer_name.replace(/_[^_]*$/, "");

        historyItem.innerHTML = `
      <div class="history-item-header">
        <div class="order-number">注文番号: ${order.order_number}</div>
        <div class="order-status ${statusClass}">${statusText}</div>
      </div>
      <div class="history-item-body">
        <div class="order-info">
          <div class="order-date">${order.formatted_date}</div>
          <div class="customer-name">${customerName}</div>
        </div>
        <div class="order-amount">
          <div class="amount-value">¥${order.total_amount.toLocaleString()}</div>
        </div>
      </div>
    `;

        return historyItem;
    }

    // ステータステキストを取得
    function getStatusText(status) {
        const statusMap = {
            pending: "処理中",
            confirmed: "確定",
            shipped: "発送済み",
            delivered: "配達完了",
            cancelled: "キャンセル",
        };
        return statusMap[status] || status;
    }

    // ページネーションを表示
    function displayPagination(pagination) {
        const pageNumbersElement = document.getElementById("page-numbers");
        const prevPageBtn = document.getElementById("prev-page");
        const nextPageBtn = document.getElementById("next-page");

        // ページ番号をクリア
        pageNumbersElement.innerHTML = "";

        // 前へボタンの状態
        prevPageBtn.disabled = pagination.current_page <= 1;
        prevPageBtn.onclick = () => {
            if (pagination.current_page > 1) {
                loadOrderHistory(pagination.current_page - 1, currentFilters);
            }
        };

        // 次へボタンの状態
        nextPageBtn.disabled = pagination.current_page >= pagination.last_page;
        nextPageBtn.onclick = () => {
            if (pagination.current_page < pagination.last_page) {
                loadOrderHistory(pagination.current_page + 1, currentFilters);
            }
        };

        // ページ番号を生成
        const startPage = Math.max(1, pagination.current_page - 2);
        const endPage = Math.min(
            pagination.last_page,
            pagination.current_page + 2
        );

        for (let i = startPage; i <= endPage; i++) {
            const pageNumber = document.createElement("div");
            pageNumber.className = "page-number";
            if (i === pagination.current_page) {
                pageNumber.classList.add("active");
            }
            pageNumber.textContent = i;
            pageNumber.addEventListener("click", () => {
                loadOrderHistory(i, currentFilters);
            });
            pageNumbersElement.appendChild(pageNumber);
        }

        // ページネーションを表示
        if (pagination.last_page > 1) {
            paginationElement.style.display = "flex";
        } else {
            paginationElement.style.display = "none";
        }
    }

    // 表示状態の切り替え
    function showLoading() {
        loadingElement.style.display = "block";
        errorElement.style.display = "none";
        noHistoryElement.style.display = "none";
        historyContentElement.style.display = "none";
    }

    function showError() {
        loadingElement.style.display = "none";
        errorElement.style.display = "block";
        noHistoryElement.style.display = "none";
        historyContentElement.style.display = "none";
    }

    function showNoHistory() {
        loadingElement.style.display = "none";
        errorElement.style.display = "none";
        noHistoryElement.style.display = "block";
        historyContentElement.style.display = "none";
    }

    function showHistoryContent() {
        loadingElement.style.display = "none";
        errorElement.style.display = "none";
        noHistoryElement.style.display = "none";
        historyContentElement.style.display = "block";
    }

    // 購入履歴を読み込み
    async function loadOrderHistory(page = 1, filters = {}) {
        showLoading();
        currentPage = page;
        currentFilters = filters;

        const result = await fetchOrderHistory(page, filters);

        if (result.success) {
            displayOrderHistory(result.data.orders, result.data.pagination);
        } else {
            showError();
        }
    }

    // フィルターを取得
    function getFilters() {
        const filters = {};

        const dateFrom = document.getElementById("date-from").value;
        if (dateFrom) filters.date_from = dateFrom;

        const dateTo = document.getElementById("date-to").value;
        if (dateTo) filters.date_to = dateTo;

        const amountFrom = document.getElementById("amount-from").value;
        if (amountFrom) filters.amount_from = amountFrom;

        const amountTo = document.getElementById("amount-to").value;
        if (amountTo) filters.amount_to = amountTo;

        const status = document.getElementById("status").value;
        if (status) filters.status = status;

        return filters;
    }

    // フィルターをリセット
    function resetFilters() {
        document.getElementById("date-from").value = "";
        document.getElementById("date-to").value = "";
        document.getElementById("amount-from").value = "";
        document.getElementById("amount-to").value = "";
        document.getElementById("status").value = "";
    }

    // イベントリスナー
    document
        .getElementById("back-to-products")
        .addEventListener("click", () => {
            window.location.href = "index.html";
        });

    document.getElementById("search-btn").addEventListener("click", () => {
        const filters = getFilters();
        loadOrderHistory(1, filters);
    });

    document.getElementById("reset-btn").addEventListener("click", () => {
        resetFilters();
        loadOrderHistory(1, {});
    });

    document.getElementById("retry-btn").addEventListener("click", () => {
        loadOrderHistory(currentPage, currentFilters);
    });

    // 初期表示
    loadOrderHistory();
});
