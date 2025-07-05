class ShoppingCart {
    constructor() {
        this.apiBaseUrl = "http://localhost:8000/api/cart";
        this.items = [];
        this.isLoading = false;

        // 初期化時にサーバーからカート情報を取得
        this.loadFromServer();
    }

    // サーバーからカート情報を取得
    async loadFromServer() {
        try {
            this.setLoading(true);
            const response = await fetch(this.apiBaseUrl, {
                method: "GET",
                credentials: "include", // セッション情報を含める
                headers: {
                    Accept: "application/json",
                    "Content-Type": "application/json",
                },
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            this.items = data.items || [];
            this.notifyChange();
        } catch (error) {
            console.error("カート情報の取得に失敗:", error);
            this.items = [];
        } finally {
            this.setLoading(false);
        }
    }

    // 商品をカートに追加
    async addItem(product, quantity = 1) {
        try {
            this.setLoading(true);
            const response = await fetch(this.apiBaseUrl, {
                method: "POST",
                credentials: "include",
                headers: {
                    Accept: "application/json",
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    product_id: product.id,
                    quantity: quantity,
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || "カートへの追加に失敗しました");
            }

            // サーバーから最新のカート情報を取得
            await this.loadFromServer();

            return { success: true, message: data.message };
        } catch (error) {
            console.error("カートへの追加に失敗:", error);
            return { success: false, error: error.message };
        } finally {
            this.setLoading(false);
        }
    }

    // 商品の数量を変更
    async updateQuantity(cartItemId, quantity) {
        try {
            this.setLoading(true);
            const response = await fetch(`${this.apiBaseUrl}/${cartItemId}`, {
                method: "PUT",
                credentials: "include",
                headers: {
                    Accept: "application/json",
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    quantity: quantity,
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || "数量の更新に失敗しました");
            }

            // サーバーから最新のカート情報を取得
            await this.loadFromServer();

            return { success: true, message: data.message };
        } catch (error) {
            console.error("数量の更新に失敗:", error);
            return { success: false, error: error.message };
        } finally {
            this.setLoading(false);
        }
    }

    // 商品をカートから削除
    async removeItem(cartItemId) {
        try {
            this.setLoading(true);
            const response = await fetch(`${this.apiBaseUrl}/${cartItemId}`, {
                method: "DELETE",
                credentials: "include",
                headers: {
                    Accept: "application/json",
                    "Content-Type": "application/json",
                },
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || "削除に失敗しました");
            }

            // サーバーから最新のカート情報を取得
            await this.loadFromServer();

            return { success: true, message: data.message };
        } catch (error) {
            console.error("削除に失敗:", error);
            return { success: false, error: error.message };
        } finally {
            this.setLoading(false);
        }
    }

    // カートを空にする
    async clear() {
        try {
            this.setLoading(true);
            const response = await fetch(this.apiBaseUrl, {
                method: "DELETE",
                credentials: "include",
                headers: {
                    Accept: "application/json",
                    "Content-Type": "application/json",
                },
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || "カートのクリアに失敗しました");
            }

            this.items = [];
            this.notifyChange();

            return { success: true, message: data.message };
        } catch (error) {
            console.error("カートのクリアに失敗:", error);
            return { success: false, error: error.message };
        } finally {
            this.setLoading(false);
        }
    }

    // カート内の商品数を取得
    getTotalItems() {
        return this.items.reduce((total, item) => total + item.quantity, 0);
    }

    // カートの合計金額を取得
    getTotalPrice() {
        return this.items.reduce((total, item) => total + item.subtotal, 0);
    }

    // カート内容を取得
    getItems() {
        return [...this.items]; // コピーを返す
    }

    // ローディング状態を設定
    setLoading(loading) {
        this.isLoading = loading;
        this.notifyLoadingChange();
    }

    // ローディング状態を取得
    getLoading() {
        return this.isLoading;
    }

    // カート変更時のイベント通知
    notifyChange() {
        window.dispatchEvent(
            new CustomEvent("cartChanged", {
                detail: {
                    items: this.getItems(),
                    totalItems: this.getTotalItems(),
                    totalPrice: this.getTotalPrice(),
                },
            })
        );
    }

    // ローディング状態変更時のイベント通知
    notifyLoadingChange() {
        window.dispatchEvent(
            new CustomEvent("cartLoadingChanged", {
                detail: {
                    isLoading: this.isLoading,
                },
            })
        );
    }
}

// グローバルなカートインスタンスを作成
window.cart = new ShoppingCart();
