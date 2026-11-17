import "reflect-metadata";
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from "typeorm";
import { User } from "./User";

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

  @Column({ nullable: true })
  entityId!: number;

  @Column("jsonb", { default: {} })
  meta!: any;

  @Column({ type: "timestamptz", default: () => "CURRENT_TIMESTAMP" })
  createdAt!: Date;

  @ManyToOne(() => User, (user) => user.auditLogs, { nullable: true })
  @JoinColumn({ name: "actorId" })
  actor!: User;
}
