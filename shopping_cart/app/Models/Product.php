<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Product extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'price',
        'stock',
        'description',
        'image_path',
    ];

    // 在庫が十分かチェック
    public function hasEnoughStock($quantity)
    {
        return $this->stock >= $quantity;
    }

    // 在庫を安全に減算
    public function decrementStock($quantity)
    {
        if (!$this->hasEnoughStock($quantity)) {
            throw new \Exception("商品「{$this->name}」の在庫が不足しています。利用可能在庫: {$this->stock}");
        }

        // 楽観的ロックを使用して安全に在庫を減算
        $affected = $this->where('id', $this->id)
            ->where('stock', '>=', $quantity)
            ->decrement('stock', $quantity);

        if ($affected === 0) {
            // 他のユーザーが同時に購入して在庫が不足した場合
            $this->refresh(); // 最新の在庫情報を取得
            throw new \Exception("商品「{$this->name}」の在庫が不足しています。利用可能在庫: {$this->stock}");
        }

        $this->refresh(); // モデルの在庫情報を更新
        return true;
    }

    // 在庫を増加（キャンセル時など）
    public function incrementStock($quantity)
    {
        $this->increment('stock', $quantity);
        return true;
    }

    // 在庫状況を取得
    public function getStockStatus()
    {
        if ($this->stock <= 0) {
            return 'out_of_stock';
        } elseif ($this->stock <= 5) {
            return 'low_stock';
        } else {
            return 'in_stock';
        }
    }

    // 在庫警告レベルかチェック
    public function isLowStock($threshold = 5)
    {
        return $this->stock <= $threshold && $this->stock > 0;
    }

    // 在庫切れかチェック
    public function isOutOfStock()
    {
        return $this->stock <= 0;
    }
}
