<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Product; // モデルを使うために追加

class ProductController extends Controller
{
    // 商品一覧を取得して返す
    public function index()
    {
        // 全商品を取得
        $products = Product::all();

        // 取得した商品データを返す（今回はJSONで返す形にしておく）
        return response()->json($products);
    }
}
