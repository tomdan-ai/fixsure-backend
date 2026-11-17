import "reflect-metadata";
import { Entity, PrimaryColumn, Column, ManyToOne } from "typeorm";
import { MaintenanceRequest } from "./MaintenanceRequest";
import { User } from "./User";

@Entity()
export class Evidence {
  @PrimaryColumn()
  id!: number;

  @Column()
  requestId!: number;

  @Column({ enum: ["BEFORE", "AFTER"] })
  kind!: "BEFORE" | "AFTER";

  @Column()
  url!: string;

  @Column()
  note!: string;

  @Column({ type: "timestamptz", default: () => "CURRENT_TIMESTAMP" })
  createdAt!: Date;

  @ManyToOne(() => MaintenanceRequest, (request) => request.evidence)
  request!: MaintenanceRequest;

  @ManyToOne(() => User, (user) => user.evidence)
  uploadedBy!: User;
}