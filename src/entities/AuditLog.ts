import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
} from "typeorm";
import { User } from "./User";
import { MaintenanceRequest } from "./MaintenanceRequest";
import { Quote } from "./Quote";
import { Payment } from "./Payment";
import { Dispute } from "./Dispute";

@Entity()
export class AuditLog {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  actorId!: string;

  @Column()
  action!: string;

  @Column()
  entity!: string;

  @Column()
  entityId!: number;

  @Column("jsonb", { default: {} })
  meta!: any;

  @Column({ type: "timestamptz", default: () => "CURRENT_TIMESTAMP" })
  createdAt!: Date;

  @ManyToOne(() => User, (user) => user.auditLogs)
  actor!: User;
}