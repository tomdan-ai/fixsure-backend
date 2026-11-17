import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
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

  @Column({ enum: ["OPEN", "RESOLVED_PAYOUT", "RESOLVED_REFUND"] })
  status!: "OPEN" | "RESOLVED_PAYOUT" | "RESOLVED_REFUND";

  @Column()
  reason!: string;

  @Column({ nullable: true })
  decision!: "PAYOUT" | "REFUND" | null;

  @Column({ nullable: true })
  decisionReason!: string | null;

  @Column({ nullable: true })
  decidedBy!: string | null;

  @Column({ type: "jsonb", default: {} })
  meta!: any;

  @ManyToOne(() => User, (user) => user.disputes)
  raisedBy!: User;

  @ManyToOne(() => MaintenanceRequest, (request) => request.disputes)
  request!: MaintenanceRequest;

  @OneToMany(() => Evidence, (evidence) => evidence.requestId, { nullable: true })
  evidence?: Evidence[];
}