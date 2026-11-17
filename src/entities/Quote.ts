import "reflect-metadata";
import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from "typeorm";
import { MaintenanceRequest } from "./MaintenanceRequest";
import { User } from "./User";

@Entity()
export class Quote {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  requestId!: number;

  @ManyToOne(() => MaintenanceRequest, (request) => request.quotes, { nullable: true })
  @JoinColumn({ name: "requestId" })
  request!: MaintenanceRequest;

  @ManyToOne(() => User, (user) => user.quotes, { nullable: true })
  technician!: User;

  @Column("numeric")
  price!: number;

  @Column("text")
  scope!: string;

  @Column("integer")
  durationDays!: number;

  @Column({ default: "SUBMITTED" })
  status!: "SUBMITTED" | "SELECTED" | "NOT_SELECTED";

  @Column({ default: false })
  isBestValue!: boolean;
}
