import "reflect-metadata";
import { Entity, PrimaryColumn, Column, ManyToOne, OneToMany } from "typeorm";
import { User } from "./User";
import { Property } from "./Property";
import { TechnicianProfile } from "./TechnicianProfile";
import { Quote } from "./Quote";
import { Evidence } from "./Evidence";
import { Dispute } from "./Dispute";
import { AuditLog } from "./AuditLog";

@Entity()
export class MaintenanceRequest {
  @PrimaryColumn()
  id!: number;

  @Column()
  propertyId!: number;

  @Column({ enum: ["ELECTRICAL", "PLUMBING", "AC_REFRIGERATION"] })
  category!: "ELECTRICAL" | "PLUMBING" | "AC_REFRIGERATION";

  @Column()
  title!: string;

  @Column()
  description!: string;

  @Column()
  urgency!: "LOW" | "MEDIUM" | "HIGH";

  @Column()
  preferredDate!: Date;

  @Column({ default: "OPEN" })
  status!: "OPEN" | "AWAITING_PAYMENT" | "FUNDED" | "IN_PROGRESS" | "AWAITING_CONFIRMATION" | "COMPLETED" | "CANCELLED" | "DISPUTED";

  @Column({ nullable: true })
  selectedQuoteId!: number | null;

  @ManyToOne(() => Property, (property) => property.requests)
  property!: Property;

  @ManyToOne(() => User, (user) => user.managedProperties, { nullable: true })
  createdBy!: User | null;

  @OneToMany(() => Quote, (quote) => quote.request)
  quotes!: Quote[];

  @OneToMany(() => Evidence, (evidence) => evidence.requestId)
  evidence!: Evidence[];

  @OneToMany(() => Dispute, (dispute) => dispute.requestId)
  disputes!: Dispute[];

  @OneToMany(() => AuditLog, (log) => log.entityId)
  auditLogs!: AuditLog[];
}