import "reflect-metadata";
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  JoinColumn,
} from "typeorm";
import { User } from "./User";
import { MaintenanceRequest } from "./MaintenanceRequest";
import { Evidence } from "./Evidence";

@Entity()
export class Dispute {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  requestId!: number;

  @Column({ enum: ["OPEN", "RESOLVED_PAYOUT", "RESOLVED_REFUND"], default: "OPEN" })
  status!: "OPEN" | "RESOLVED_PAYOUT" | "RESOLVED_REFUND";

  @Column({ type: "varchar" })
  reason!: string;

  @Column({ nullable: true, type: "varchar" })
  decision!: "PAYOUT" | "REFUND" | null;

  @Column({ nullable: true, type: "varchar" })
  decisionReason!: string | null;

  @Column({ nullable: true, type: "varchar" })
  decidedBy!: string | null;

  @Column({ type: "jsonb", default: {} })
  meta!: any;

  @ManyToOne(() => User, (user) => user.disputes, { nullable: true })
  raisedBy!: User;

  @ManyToOne(() => MaintenanceRequest, (request) => request.disputes, { nullable: true })
  @JoinColumn({ name: "requestId" })
  request!: MaintenanceRequest;

  @OneToMany(() => Evidence, (evidence) => evidence.request, { nullable: true })
  evidence?: Evidence[];
}
