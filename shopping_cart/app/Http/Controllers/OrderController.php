<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Product;
use App\Models\CartItem;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Session;

class OrderController extends Controller
{
    // セッションIDを取得
    private function getSessionId()
    {
        if (!Session::has('cart_session_id')) {
            Session::put('cart_session_id', Session::getId());
        }
        return Session::get('cart_session_id');
    }

    // 購入履歴一覧取得
    public function index(Request $request)
    {
        try {
            $sessionId = $this->getSessionId();

            // ページネーション設定
            $perPage = $request->get('per_page', 10);
            $perPage = min($perPage, 50); // 最大50件まで

            // 検索条件
            $query = Order::query();

            // セッションIDでフィルタ（実際のアプリではユーザーIDを使用）
            // 今回はセッション管理のため、セッションIDで履歴を管理
            $query->where('customer_name', 'LIKE', '%' . $sessionId . '%')
                ->orWhere('phone', 'LIKE', '%' . $sessionId . '%');

            // 日付範囲での絞り込み
            if ($request->has('date_from')) {
                $query->whereDate('created_at', '>=', $request->date_from);
            }

            if ($request->has('date_to')) {
                $query->whereDate('created_at', '<=', $request->date_to);
            }

            // 金額範囲での絞り込み
            if ($request->has('amount_from')) {
                $query->where('total_amount', '>=', $request->amount_from);
            }

            if ($request->has('amount_to')) {
                $query->where('total_amount', '<=', $request->amount_to);
            }

            // ステータスでの絞り込み
            if ($request->has('status')) {
                $query->where('status', $request->status);
            }

            // 並び順（新しい順）
            $query->orderBy('created_at', 'desc');

            // ページネーション実行
            $orders = $query->paginate($perPage);

            // レスポンス用にデータを整形
            $formattedOrders = $orders->map(function ($order) {
                return [
                    'id' => $order->id,
                    'order_number' => $order->order_number,
                    'customer_name' => $order->customer_name,
                    'total_amount' => $order->total_amount,
                    'status' => $order->status,
                    'created_at' => $order->created_at,
                    'formatted_date' => $order->created_at->format('Y年m月d日 H:i'),
                ];
            });

            return response()->json([
                'orders' => $formattedOrders,
                'pagination' => [
                    'current_page' => $orders->currentPage(),
                    'last_page' => $orders->lastPage(),
                    'per_page' => $orders->perPage(),
                    'total' => $orders->total(),
                    'from' => $orders->firstItem(),
                    'to' => $orders->lastItem(),
                ],
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'error' => '購入履歴の取得に失敗しました',
                'details' => $e->getMessage(),
            ], 500);
        }
    }

    // 注文作成（既存のメソッド）
    public function store(Request $request)
    {
        // 詳細バリデーション
        $validated = $request->validate([
            'customer_name' => [
                'required',
                'string',
                'min:2',
                'max:255',
                'regex:/^[ぁ-んァ-ヶー一-龠a-zA-Z\s]+$/',
            ],
            'address' => [
                'required',
                'string',
                'min:10',
                'max:500',
            ],
            'phone' => [
                'required',
                'string',
                'regex:/^[0-9-]{10,15}$/',
            ],
        ], [
            'customer_name.required' => '氏名は必須です',
            'customer_name.min' => '氏名は2文字以上で入力してください',
            'customer_name.max' => '氏名は255文字以内で入力してください',
            'customer_name.regex' => '氏名は日本語または英語で入力してください',
            'address.required' => '住所は必須です',
            'address.min' => '住所は10文字以上で入力してください',
            'address.max' => '住所は500文字以内で入力してください',
            'phone.required' => '電話番号は必須です',
            'phone.regex' => '正しい電話番号を入力してください（例：090-1234-5678）',
        ]);

        $sessionId = $this->getSessionId();

        // トランザクション開始
        DB::beginTransaction();

        try {
            // カートアイテムを取得（行ロック）
            $cartItems = CartItem::where('session_id', $sessionId)
                ->with(['product' => function ($query) {
                    $query->lockForUpdate();
                }])
                ->get();

            if ($cartItems->isEmpty()) {
                DB::rollback();
                return response()->json([
                    'error' => 'カートが空です'
                ], 400);
            }

            // 在庫チェックと商品の存在確認
            $stockErrors = [];
            $totalAmount = 0;

            foreach ($cartItems as $cartItem) {
                $product = $cartItem->product;

                if (!$product) {
                    $stockErrors[] = "商品ID {$cartItem->product_id} が見つかりません";
                    continue;
                }

                if (!$product->hasEnoughStock($cartItem->quantity)) {
                    $stockErrors[] = "商品「{$product->name}」の在庫が不足しています（利用可能: {$product->stock}個、要求: {$cartItem->quantity}個）";
                    continue;
                }

                $totalAmount += $product->price * $cartItem->quantity;
            }

            if (!empty($stockErrors)) {
                DB::rollback();
                return response()->json([
                    'error' => '在庫不足のため注文を作成できません',
                    'stock_errors' => $stockErrors,
                ], 400);
            }

            // 注文番号を生成
            $orderNumber = Order::generateOrderNumber();

            // 注文を作成（履歴管理のためセッションIDを含める）
            $order = Order::create([
                'order_number' => $orderNumber,
                'customer_name' => $validated['customer_name'] . '_' . $sessionId, // セッション識別用
                'address' => $validated['address'],
                'phone' => $validated['phone'] . '_' . $sessionId, // セッション識別用
                'total_amount' => $totalAmount,
                'status' => 'confirmed',
            ]);

            // 注文アイテムを作成 & 在庫を減算
            foreach ($cartItems as $cartItem) {
                $product = $cartItem->product;
                $subtotal = $product->price * $cartItem->quantity;

                // 注文アイテムを作成
                OrderItem::create([
                    'order_id' => $order->id,
                    'product_id' => $product->id,
                    'product_name' => $product->name,
                    'price' => $product->price,
                    'quantity' => $cartItem->quantity,
                    'subtotal' => $subtotal,
                ]);

                // 在庫を安全に減算
                $product->decrementStock($cartItem->quantity);
            }

            // カートをクリア
            CartItem::where('session_id', $sessionId)->delete();

            // トランザクションをコミット
            DB::commit();

            return response()->json([
                'message' => '注文が正常に作成されました',
                'order' => [
                    'id' => $order->id,
                    'order_number' => $order->order_number,
                    'customer_name' => $validated['customer_name'], // 表示用は元の名前
                    'address' => $order->address,
                    'phone' => $validated['phone'], // 表示用は元の電話番号
                    'total_amount' => $order->total_amount,
                    'status' => $order->status,
                    'created_at' => $order->created_at,
                ],
            ], 201);
        } catch (\Exception $e) {
            // トランザクションをロールバック
            DB::rollback();

            return response()->json([
                'error' => '注文の作成に失敗しました',
                'details' => $e->getMessage(),
            ], 500);
        }
    }

    // 注文詳細取得（既存のメソッド）
    public function show($orderNumber)
    {
        try {
            $order = Order::where('order_number', $orderNumber)
                ->with('orderItems')
                ->first();

            if (!$order) {
                return response()->json([
                    'error' => '注文が見つかりません'
                ], 404);
            }

            // セッション確認（簡易的な認証）
            $sessionId = $this->getSessionId();
            if (!str_contains($order->customer_name, $sessionId) && !str_contains($order->phone, $sessionId)) {
                return response()->json([
                    'error' => 'アクセス権限がありません'
                ], 403);
            }

            return response()->json([
                'order' => [
                    'id' => $order->id,
                    'order_number' => $order->order_number,
                    'customer_name' => str_replace('_' . $sessionId, '', $order->customer_name),
                    'address' => $order->address,
                    'phone' => str_replace('_' . $sessionId, '', $order->phone),
                    'total_amount' => $order->total_amount,
                    'status' => $order->status,
                    'created_at' => $order->created_at,
                    'items' => $order->orderItems->map(function ($item) {
                        return [
                            'product_name' => $item->product_name,
                            'price' => $item->price,
                            'quantity' => $item->quantity,
                            'subtotal' => $item->subtotal,
                        ];
                    }),
                ],
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'error' => '注文の取得に失敗しました',
                'details' => $e->getMessage(),
            ], 500);
        }
    }
}
