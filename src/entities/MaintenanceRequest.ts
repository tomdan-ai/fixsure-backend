import "reflect-metadata";
import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany, JoinColumn } from "typeorm";
import { User } from "./User";
import { Property } from "./Property";
import { Quote } from "./Quote";
import { Evidence } from "./Evidence";
import { Dispute } from "./Dispute";
import { Payment } from "./Payment";

@Entity()
export class MaintenanceRequest {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ nullable: true })
  propertyId!: string;

  @Column({ enum: ["ELECTRICAL", "PLUMBING", "AC_REFRIGERATION"], default: "ELECTRICAL" })
  category!: "ELECTRICAL" | "PLUMBING" | "AC_REFRIGERATION";

  @Column()
  title!: string;

  @Column()
  description!: string;

  @Column({ default: "MEDIUM" })
  urgency!: "LOW" | "MEDIUM" | "HIGH";

  @Column({ type: "timestamptz", default: () => "CURRENT_TIMESTAMP" })
  preferredDate!: Date;

  @Column({ default: "OPEN" })
  status!: "OPEN" | "AWAITING_PAYMENT" | "FUNDED" | "IN_PROGRESS" | "AWAITING_CONFIRMATION" | "COMPLETED" | "CANCELLED" | "DISPUTED";

  @Column({ nullable: true, type: "integer" })
  selectedQuoteId!: number | null;

  @ManyToOne(() => Property, (property) => property.requests, { nullable: true })
  @JoinColumn({ name: "propertyId" })
  property!: Property;

  @ManyToOne(() => User, (user) => user.managedProperties, { nullable: true })
  createdBy!: User | null;

  @OneToMany(() => Quote, (quote) => quote.request)
  quotes!: Quote[];

  @OneToMany(() => Evidence, (evidence) => evidence.request)
  evidence!: Evidence[];

  @OneToMany(() => Dispute, (dispute) => dispute.request)
  disputes!: Dispute[];

  @OneToMany(() => Payment, (payment) => payment.request)
  payments!: Payment[];
}
