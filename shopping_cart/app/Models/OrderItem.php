<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class OrderItem extends Model
{
    use HasFactory;

    protected $fillable = [
        'order_id',
        'product_id',
        'product_name',
        'price',
        'quantity',
        'subtotal',
    ];

    // 注文との関連
    public function order()
    {
        return $this->belongsTo(Order::class);
    }

    // 商品との関連
    public function product()
    {
        return $this->belongsTo(Product::class);
    }
}
