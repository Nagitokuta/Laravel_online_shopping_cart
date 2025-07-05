<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class CreateCartItemsTable extends Migration
{
    public function up()
    {
        Schema::create('cart_items', function (Blueprint $table) {
            $table->id();
            $table->string('session_id'); // セッションID
            $table->foreignId('product_id')->constrained('products'); // 商品ID（外部キー）
            $table->integer('quantity'); // 数量
            $table->timestamps();

            // セッションIDと商品IDの組み合わせをユニークにする
            $table->unique(['session_id', 'product_id']);
        });
    }

    public function down()
    {
        Schema::dropIfExists('cart_items');
    }
}
