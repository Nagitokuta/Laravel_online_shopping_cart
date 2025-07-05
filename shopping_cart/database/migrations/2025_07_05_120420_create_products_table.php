<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class CreateProductsTable extends Migration
{
    public function up()
    {
        Schema::create('products', function (Blueprint $table) {
            $table->id(); // 商品ID（主キー、自動増分）
            $table->string('name'); // 商品名
            $table->integer('price'); // 価格
            $table->integer('stock'); // 在庫数
            $table->text('description')->nullable(); // 説明文（空でもOK）
            $table->string('image_path')->nullable(); // 画像パス（空でもOK）
            $table->timestamps(); // created_at, updated_at を自動追加
        });
    }

    public function down()
    {
        Schema::dropIfExists('products');
    }
}
