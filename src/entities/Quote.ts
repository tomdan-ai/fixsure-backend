import "reflect-metadata";
import { Entity, PrimaryColumn, Column, ManyToOne } from "typeorm";
import { MaintenanceRequest } from "./MaintenanceRequest";
import { User } from "./User";

@Entity()
export class Quote {
  @PrimaryColumn()
  id!: number;

  @Column()
  requestId!: number;

  @ManyToOne(() => MaintenanceRequest, (request) => request.quotes)
  request!: MaintenanceRequest;

  @ManyToOne(() => User, (user) => user.quotes)
  technician!: User;

  @Column()
  price!: number;

  @Column("text")
  scope!: string;

  @Column()
  durationDays!: number;

  @Column({ default: "SUBMITTED" })
  status!: "SUBMITTED" | "SELECTED" | "NOT_SELECTED";

  @Column({ default: false })
  isBestValue!: boolean;
}