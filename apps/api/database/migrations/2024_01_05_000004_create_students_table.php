<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('students', function (Blueprint $table) {
            $table->id();
            $table->foreignId('academic_year_id')->constrained('academic_years')->onDelete('cascade');
            $table->string('name', 100);
            $table->foreignId('current_class_id')->nullable()->constrained('classes')->nullOnDelete();
            $table->string('former_class', 10)->nullable();
            $table->integer('rank')->nullable();
            $table->decimal('marks_percentage', 5, 2)->nullable();
            $table->enum('status', ['active', 'repeating', 'promoted', 'transferred'])->default('active');
            $table->timestamps();
            $table->index('academic_year_id');
            $table->index('current_class_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('students');
    }
};
?>
