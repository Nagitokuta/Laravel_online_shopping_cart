<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\CartItem;
use App\Models\Product;
use Illuminate\Support\Facades\Session;
use Illuminate\Support\Facades\DB;

class CartController extends Controller
{
    // セッションIDを取得（なければ生成）
    private function getSessionId()
    {
        if (!Session::has('cart_session_id')) {
            Session::put('cart_session_id', Session::getId());
        }
        return Session::get('cart_session_id');
    }

    // カート一覧取得
    public function index()
    {
        $sessionId = $this->getSessionId();

        $cartItems = CartItem::where('session_id', $sessionId)
            ->with('product')
            ->get();

        // 在庫状況をチェックして警告を追加
        $formattedItems = $cartItems->map(function ($item) {
            $product = $item->product;
            $warnings = [];

            // 商品が存在しない場合
            if (!$product) {
                $warnings[] = '商品が見つかりません';
            } else {
                // 在庫不足の場合
                if (!$product->hasEnoughStock($item->quantity)) {
                    $warnings[] = "在庫不足（利用可能: {$product->stock}個）";
                }

                // 在庫警告レベルの場合
                if ($product->isLowStock() && $product->hasEnoughStock($item->quantity)) {
                    $warnings[] = '在庫残りわずか';
                }
            }

            return [
                'id' => $item->id,
                'product_id' => $item->product_id,
                'name' => $product ? $product->name : '商品が見つかりません',
                'price' => $product ? $product->price : 0,
                'quantity' => $item->quantity,
                'subtotal' => $product ? ($product->price * $item->quantity) : 0,
                'stock_status' => $product ? $product->getStockStatus() : 'unavailable',
                'available_stock' => $product ? $product->stock : 0,
                'warnings' => $warnings,
            ];
        });

        $total = $formattedItems->sum('subtotal');

        return response()->json([
            'items' => $formattedItems,
            'total' => $total,
            'count' => $formattedItems->sum('quantity'),
        ]);
    }

    // カートに商品追加（在庫チェック強化版）
    public function store(Request $request)
    {
        // バリデーション
        $validated = $request->validate([
            'product_id' => 'required|integer|exists:products,id',
            'quantity' => 'required|integer|min:1|max:99',
        ]);

        $sessionId = $this->getSessionId();
        $productId = $validated['product_id'];
        $quantity = $validated['quantity'];

        // トランザクション開始
        DB::beginTransaction();

        try {
            // 商品を取得（行ロック）
            $product = Product::lockForUpdate()->find($productId);

            if (!$product) {
                return response()->json([
                    'error' => '商品が見つかりません',
                ], 404);
            }

            // 既存のカートアイテムをチェック
            $cartItem = CartItem::where('session_id', $sessionId)
                ->where('product_id', $productId)
                ->first();

            $totalQuantity = $quantity;
            if ($cartItem) {
                $totalQuantity = $cartItem->quantity + $quantity;
            }

            // 在庫チェック
            if (!$product->hasEnoughStock($totalQuantity)) {
                DB::rollback();
                return response()->json([
                    'error' => '在庫が不足しています',
                    'available_stock' => $product->stock,
                    'requested_quantity' => $totalQuantity,
                    'current_cart_quantity' => $cartItem ? $cartItem->quantity : 0,
                ], 400);
            }

            if ($cartItem) {
                // 既存アイテムの数量を更新
                $cartItem->quantity = $totalQuantity;
                $cartItem->save();
            } else {
                // 新しいカートアイテムを作成
                $cartItem = CartItem::create([
                    'session_id' => $sessionId,
                    'product_id' => $productId,
                    'quantity' => $quantity,
                ]);
            }

            DB::commit();

            return response()->json([
                'message' => 'カートに追加しました',
                'item' => [
                    'id' => $cartItem->id,
                    'product_id' => $cartItem->product_id,
                    'name' => $product->name,
                    'price' => $product->price,
                    'quantity' => $cartItem->quantity,
                    'subtotal' => $product->price * $cartItem->quantity,
                    'stock_status' => $product->getStockStatus(),
                    'available_stock' => $product->stock,
                ],
            ], 201);
        } catch (\Exception $e) {
            DB::rollback();
            return response()->json([
                'error' => 'カートへの追加に失敗しました',
                'details' => $e->getMessage(),
            ], 500);
        }
    }

    // カートアイテムの数量更新（在庫チェック強化版）
    public function update(Request $request, $id)
    {
        // バリデーション
        $validated = $request->validate([
            'quantity' => 'required|integer|min:1|max:99',
        ]);

        $sessionId = $this->getSessionId();
        $newQuantity = $validated['quantity'];

        // トランザクション開始
        DB::beginTransaction();

        try {
            $cartItem = CartItem::where('id', $id)
                ->where('session_id', $sessionId)
                ->firstOrFail();

            // 商品を取得（行ロック）
            $product = Product::lockForUpdate()->find($cartItem->product_id);

            if (!$product) {
                DB::rollback();
                return response()->json([
                    'error' => '商品が見つかりません',
                ], 404);
            }

            // 在庫チェック
            if (!$product->hasEnoughStock($newQuantity)) {
                DB::rollback();
                return response()->json([
                    'error' => '在庫が不足しています',
                    'available_stock' => $product->stock,
                    'requested_quantity' => $newQuantity,
                ], 400);
            }

            $cartItem->quantity = $newQuantity;
            $cartItem->save();

            DB::commit();

            return response()->json([
                'message' => '数量を更新しました',
                'item' => [
                    'id' => $cartItem->id,
                    'product_id' => $cartItem->product_id,
                    'name' => $product->name,
                    'price' => $product->price,
                    'quantity' => $cartItem->quantity,
                    'subtotal' => $product->price * $cartItem->quantity,
                    'stock_status' => $product->getStockStatus(),
                    'available_stock' => $product->stock,
                ],
            ]);
        } catch (\Exception $e) {
            DB::rollback();
            return response()->json([
                'error' => '数量の更新に失敗しました',
                'details' => $e->getMessage(),
            ], 500);
        }
    }

    // カートアイテム削除
    public function destroy($id)
    {
        $sessionId = $this->getSessionId();

        try {
            $cartItem = CartItem::where('id', $id)
                ->where('session_id', $sessionId)
                ->firstOrFail();

            $cartItem->delete();

            return response()->json([
                'message' => 'カートから削除しました',
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'error' => '削除に失敗しました',
                'details' => $e->getMessage(),
            ], 500);
        }
    }

    // カートを空にする
    public function clear()
    {
        $sessionId = $this->getSessionId();

        try {
            CartItem::where('session_id', $sessionId)->delete();

            return response()->json([
                'message' => 'カートを空にしました',
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'error' => 'カートのクリアに失敗しました',
                'details' => $e->getMessage(),
            ], 500);
        }
    }
}
