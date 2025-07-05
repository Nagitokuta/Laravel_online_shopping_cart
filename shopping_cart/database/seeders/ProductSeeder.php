<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class ProductSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // 商品データを一括で挿入
        DB::table('products')->insert([
            [
                'name' => '商品A',
                'price' => 1000,
                'stock' => 10,
                'description' => '高品質な商品Aです。',
                'image_path' => null,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'name' => '商品B',
                'price' => 2500,
                'stock' => 5,
                'description' => 'プレミアムな商品Bです。',
                'image_path' => null,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'name' => '商品C',
                'price' => 800,
                'stock' => 20,
                'description' => 'お手頃価格の商品Cです。',
                'image_path' => null,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'name' => '商品D',
                'price' => 1500,
                'stock' => 8,
                'description' => '人気の商品Dです。',
                'image_path' => null,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'name' => '商品E',
                'price' => 3000,
                'stock' => 3,
                'description' => '限定商品Eです。',
                'image_path' => null,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'name' => '商品S',
                'price' => 13000,
                'stock' => 1,
                'description' => '限定商品Sです。',
                'image_path' => null,
                'created_at' => now(),
                'updated_at' => now(),
            ],
        ]);
    }
}
