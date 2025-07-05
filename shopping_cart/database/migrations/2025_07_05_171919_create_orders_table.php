<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class CreateOrdersTable extends Migration
{
    public function up()
    {
        Schema::create('orders', function (Blueprint $table) {
            $table->id();
            $table->string('order_number')->unique(); // 注文番号
            $table->string('customer_name'); // 顧客名
            $table->text('address'); // 配送先住所
            $table->string('phone'); // 電話番号
            $table->integer('total_amount'); // 合計金額
            $table->string('status')->default('pending'); // 注文ステータス
            $table->timestamps();
        });
    }

    public function down()
    {
        Schema::dropIfExists('orders');
    }
}
