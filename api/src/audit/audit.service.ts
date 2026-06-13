import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuditLog } from '../entities/audit-log.entity';

@Injectable()
export class AuditService {
  private readonly logger = new Logger(AuditService.name);

  constructor(
    @InjectRepository(AuditLog) private repo: Repository<AuditLog>,
  ) {}

  // Fire-and-forget: never let audit logging break the request.
  async log(params: {
    actor_id?: number;
    actor_name?: string;
    actor_role?: string;
    action: string;
    details?: string;
    ip_address?: string;
  }) {
    try {
      await this.repo.save(
        this.repo.create({
          actor_id: params.actor_id ?? null,
          actor_name: params.actor_name || 'System',
          actor_role: params.actor_role || 'system',
          action: params.action,
          details: params.details ?? '',
          ip_address: params.ip_address || '—',
        }),
      );
    } catch (e) {
      this.logger.warn(`Failed to write audit log: ${(e as Error).message}`);
    }
  }

  async list(limit = 500) {
    const rows = await this.repo.find({ order: { created_at: 'DESC' }, take: limit });
    return rows.map((r) => ({
      timestamp: r.created_at,
      user: r.actor_name,
      role: r.actor_role,
      action: r.action,
      details: r.details,
      ip_address: r.ip_address,
    }));
  }
}
