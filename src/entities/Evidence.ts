import "reflect-metadata";
import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from "typeorm";
import { MaintenanceRequest } from "./MaintenanceRequest";
import { User } from "./User";

@Entity()
export class Evidence {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  requestId!: number;

  @Column({ enum: ["BEFORE", "AFTER"] })
  kind!: "BEFORE" | "AFTER";

  @Column()
  url!: string;

  @Column({ default: "" })
  note!: string;

  @Column({ type: "timestamptz", default: () => "CURRENT_TIMESTAMP" })
  createdAt!: Date;

  @ManyToOne(() => MaintenanceRequest, (request) => request.evidence, { nullable: true })
  @JoinColumn({ name: "requestId" })
  request!: MaintenanceRequest;

  @ManyToOne(() => User, (user) => user.evidence, { nullable: true })
  uploadedBy!: User;
}
