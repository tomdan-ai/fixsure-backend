import { Controller, Post, Get, Param, ParseIntPipe } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import { NotificationsService } from './notifications.service';
import { CurrentToken } from '../common/auth.decorator';

@ApiTags('Notifications')
@ApiBearerAuth()
@Controller('api/notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  @ApiOperation({ summary: 'Get current user notifications' })
  @ApiResponse({ status: 200, description: 'List of notifications' })
  async getAll(@CurrentToken() token: string) {
    return this.notificationsService.getNotifications(token);
  }

  @Post(':id/read')
  @ApiOperation({ summary: 'Mark notification as read' })
  @ApiResponse({ status: 200, description: 'Notification marked as read' })
  async markRead(@Param('id', ParseIntPipe) id: number) {
    return this.notificationsService.markAsRead(id);
  }
}
