import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../entities/User';
import { TechnicianProfile } from '../entities/TechnicianProfile';
import { Property } from '../entities/Property';
import { MaintenanceRequest } from '../entities/MaintenanceRequest';
import { Quote } from '../entities/Quote';
import { Payment } from '../entities/Payment';
import { Evidence } from '../entities/Evidence';
import { Dispute } from '../entities/Dispute';
import { Notification } from '../entities/Notification';
import { AuditLog } from '../entities/AuditLog';
import { AuthModule } from '../auth/auth.module';
import { UsersModule } from '../users/users.module';
import { PropertiesModule } from '../properties/properties.module';
import { RequestsModule } from '../requests/requests.module';
import { QuotesModule } from '../quotes/quotes.module';
import { PaymentsModule } from '../payments/payments.module';
import { DisputesModule } from '../disputes/disputes.module';
import { AdminModule } from '../admin/admin.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { VerificationModule } from '../verification/verification.module';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5432'),
      username: process.env.DB_USERNAME || 'postgres',
      password: process.env.DB_PASSWORD || 'postgres',
      database: process.env.DB_DATABASE || 'fixsure_mvp',
      synchronize: true,
      logging: false,
      entities: [
        User,
        TechnicianProfile,
        Property,
        MaintenanceRequest,
        Quote,
        Payment,
        Evidence,
        Dispute,
        Notification,
        AuditLog,
      ],
    }),
    AuthModule,
    UsersModule,
    PropertiesModule,
    RequestsModule,
    QuotesModule,
    PaymentsModule,
    DisputesModule,
    AdminModule,
    NotificationsModule,
    VerificationModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}