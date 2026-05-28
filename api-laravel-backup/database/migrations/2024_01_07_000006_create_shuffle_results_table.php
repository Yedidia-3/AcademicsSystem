<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('shuffle_results', function (Blueprint $table) {
            $table->id();
            $table->foreignId('shuffle_session_id')->constrained('shuffle_sessions')->onDelete('cascade');
            $table->foreignId('student_id')->constrained('students')->onDelete('cascade');
            $table->foreignId('proposed_class_id')->constrained('classes')->onDelete('cascade');
            $table->boolean('is_manual_override')->default(false);
            $table->timestamps();
            $table->index(['shuffle_session_id', 'student_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('shuffle_results');
    }
};
?>
