<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class CreateOrderItemsTable extends Migration
{
    public function up()
    {
        Schema::create('order_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('order_id')->constrained('orders')->onDelete('cascade'); // 注文ID
            $table->foreignId('product_id')->constrained('products'); // 商品ID
            $table->string('product_name'); // 商品名（スナップショット）
            $table->integer('price'); // 単価（スナップショット）
            $table->integer('quantity'); // 数量
            $table->integer('subtotal'); // 小計
            $table->timestamps();
        });
    }

    public function down()
    {
        Schema::dropIfExists('order_items');
    }
}
