<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Order extends Model
{
    use HasFactory;

    protected $fillable = [
        'order_number',
        'customer_name',
        'address',
        'phone',
        'total_amount',
        'status',
    ];

    // 注文アイテムとの関連
    public function orderItems()
    {
        return $this->hasMany(OrderItem::class);
    }

    // 注文番号を生成
    public static function generateOrderNumber()
    {
        do {
            $orderNumber = date('Ymd') . str_pad(mt_rand(1, 9999), 4, '0', STR_PAD_LEFT);
        } while (self::where('order_number', $orderNumber)->exists());

        return $orderNumber;
    }
}
