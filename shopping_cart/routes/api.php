<?php

use Illuminate\Support\Facades\Route;
use Illuminate\Session\Middleware\StartSession;
use Illuminate\Cookie\Middleware\AddQueuedCookiesToResponse;
use App\Http\Middleware\EncryptCookies;
use App\Http\Controllers\ProductController;
use App\Http\Controllers\CartController;
use App\Http\Controllers\OrderController;

// 商品関連
Route::get('/products', [ProductController::class, 'index']);

// カート関連（セッション対応）
Route::middleware([
    EncryptCookies::class,
    AddQueuedCookiesToResponse::class,
    StartSession::class,
])->prefix('cart')->group(function () {
    Route::get('/', [CartController::class, 'index']);         // カート一覧取得
    Route::post('/', [CartController::class, 'store']);        // カートに追加
    Route::put('/{id}', [CartController::class, 'update']);    // 数量更新
    Route::delete('/{id}', [CartController::class, 'destroy']); // アイテム削除
    Route::delete('/', [CartController::class, 'clear']);      // カート全削除
});

// 注文関連（同じように middleware をつける）
Route::middleware([
    EncryptCookies::class,
    AddQueuedCookiesToResponse::class,
    StartSession::class,
])->prefix('orders')->group(function () {
    Route::get('/', [OrderController::class, 'index']);
    Route::post('/', [OrderController::class, 'store']);
    Route::get('/{orderNumber}', [OrderController::class, 'show']);
});
