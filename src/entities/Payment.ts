import "reflect-metadata";
import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from "typeorm";
import { MaintenanceRequest } from "./MaintenanceRequest";
import { User } from "./User";

@Entity()
export class Payment {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  requestId!: number;

  @Column({ enum: ["COLLECTION", "PAYOUT", "REFUND"], default: "COLLECTION" })
  type!: "COLLECTION" | "PAYOUT" | "REFUND";

  @Column()
  internalRef!: string;

  @Column({ nullable: true, type: "varchar" })
  providerRef!: string | null;

  @Column("numeric")
  amount!: number;

  @Column({ default: "PENDING" })
  status!: "PENDING" | "SUCCESS" | "FAILED" | "REVERSED";

  @ManyToOne(() => User, (user) => user.payments, { nullable: true })
  requester!: User;

  @ManyToOne(() => MaintenanceRequest, (request) => request.payments, { nullable: true })
  @JoinColumn({ name: "requestId" })
  request!: MaintenanceRequest;
}
