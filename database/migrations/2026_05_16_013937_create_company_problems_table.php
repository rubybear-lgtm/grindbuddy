<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('company_problems', function (Blueprint $table) {
            $table->id();
            $table->string('company_id');
            $table->string('problem_id');
            $table->integer('frequency')->default(0);
            $table->string('timeframe');

            $table->foreign('company_id')->references('id')->on('companies')->cascadeOnDelete();
            $table->foreign('problem_id')->references('id')->on('problems')->cascadeOnDelete();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('company_problems');
    }
};
