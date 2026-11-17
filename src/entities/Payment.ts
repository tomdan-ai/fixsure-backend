import "reflect-metadata";
import { Entity, PrimaryColumn, Column, ManyToOne } from "typeorm";
import { MaintenanceRequest } from "./MaintenanceRequest";
import { User } from "./User";

@Entity()
export class Payment {
  @PrimaryColumn()
  id!: number;

  @Column()
  requestId!: number;

  @Column({ enum: ["COLLECTION", "PAYOUT", "REFUND"] })
  type!: "COLLECTION" | "PAYOUT" | "REFUND";

  @Column()
  internalRef!: string;

  @Column({ nullable: true })
  providerRef!: string | null;

  @Column()
  amount!: number;

  @Column({ default: "PENDING" })
  status!: "PENDING" | "SUCCESS" | "FAILED" | "REVERSED";

  @ManyToOne(() => User, (user) => user.payments)
  requester!: User;

  @ManyToOne(() => MaintenanceRequest, (request) => request.auditLogs)
  request!: MaintenanceRequest;
}