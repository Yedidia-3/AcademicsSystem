<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('classes', function (Blueprint $table) {
            $table->id();
            $table->foreignId('p_level_id')->constrained('p_levels')->onDelete('cascade');
            $table->string('name', 5);
            $table->foreignId('teacher_id')->nullable()->constrained('users')->nullOnDelete();
            $table->enum('status', ['active', 'inactive'])->default('active');
            $table->timestamps();
            $table->index('p_level_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('classes');
    }
};
?>
