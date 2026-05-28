import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Notification } from '../entities/notification.entity';

@Injectable()
export class NotificationsService {
  private gateway: any;

  constructor(
    @InjectRepository(Notification) private notificationRepo: Repository<Notification>,
  ) {}

  setGateway(gateway: any) {
    this.gateway = gateway;
  }

  async notify(userId: number, message: string, type: 'info' | 'success' | 'warning' | 'error' = 'info') {
    const notification = this.notificationRepo.create({ user_id: userId, message, type });
    const saved = await this.notificationRepo.save(notification);

    // Push real-time via WebSocket if gateway is available
    if (this.gateway) {
      this.gateway.sendToUser(userId, saved);
    }

    return saved;
  }

  async getForUser(userId: number) {
    return this.notificationRepo.find({
      where: { user_id: userId },
      order: { created_at: 'DESC' },
      take: 50,
    });
  }

  async markRead(notificationId: number, userId: number) {
    await this.notificationRepo.update({ id: notificationId, user_id: userId }, { is_read: true });
    return { message: 'Marked as read' };
  }

  async markAllRead(userId: number) {
    await this.notificationRepo.update({ user_id: userId, is_read: false }, { is_read: true });
    return { message: 'All marked as read' };
  }

  async getUnreadCount(userId: number) {
    return this.notificationRepo.count({ where: { user_id: userId, is_read: false } });
  }
}
