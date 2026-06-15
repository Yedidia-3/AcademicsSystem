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
        Schema::create('shuffle_sessions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('academic_year_id')->constrained('academic_years')->onDelete('cascade');
            $table->foreignId('p_level_id')->constrained('p_levels')->onDelete('cascade');
            $table->enum('algorithm', ['round_robin', 'balanced_bands', 'snake_draft', 'auto_promote']);
            $table->enum('status', ['in_progress', 'pending_approval', 'approved', 'rejected', 'distributed'])->default('in_progress');
            $table->foreignId('submitted_by')->constrained('users')->onDelete('cascade');
            $table->foreignId('reviewed_by')->nullable()->constrained('users')->onDelete('set null');
            $table->text('rejection_note')->nullable();
            $table->timestamp('submitted_at')->nullable();
            $table->timestamp('reviewed_at')->nullable();
            $table->timestamp('distributed_at')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('shuffle_sessions');
    }
};
?>
