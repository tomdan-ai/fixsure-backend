import "reflect-metadata";
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToOne,
  OneToMany,
  Unique,
} from "typeorm";
import { TechnicianProfile } from "./TechnicianProfile";
import { MaintenanceRequest } from "./MaintenanceRequest";
import { Quote } from "./Quote";
import { Payment } from "./Payment";
import { Evidence } from "./Evidence";
import { Dispute } from "./Dispute";
import { Notification } from "./Notification";
import { AuditLog } from "./AuditLog";

@Entity()
@Unique(["email"])
export class User {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column()
  name!: string;

  @Column()
  email!: string;

  @Column()
  passwordHash!: string;

  @Column({ default: "" })
  phone!: string;

  @Column({ default: "MANAGER" })
  role!: "MANAGER" | "TECHNICIAN" | "ADMIN";

  @Column({ default: "ACTIVE" })
  status!: "ACTIVE" | "SUSPENDED";

  @Column({ default: false })
  contactVerified!: boolean;

  @Column({ default: "NOT_STARTED" })
  identityStatus!: "NOT_STARTED" | "PENDING" | "IN_REVIEW" | "VERIFIED" | "REJECTED" | "EXPIRED" | "REQUIRES_RESUBMISSION";

  @Column({ default: "NOT_STARTED" })
  professionalStatus!: string;

  @OneToOne(() => TechnicianProfile, (profile) => profile.user, { nullable: true })
  technicianProfile!: TechnicianProfile | null;

  @OneToMany(() => MaintenanceRequest, (request) => request.createdBy)
  managedProperties!: MaintenanceRequest[];

  @OneToMany(() => Quote, (quote) => quote.technician)
  quotes!: Quote[];

  @OneToMany(() => Payment, (payment) => payment.requester)
  payments!: Payment[];

  @OneToMany(() => Evidence, (evidence) => evidence.uploadedBy)
  evidence!: Evidence[];

  @OneToMany(() => Dispute, (dispute) => dispute.raisedBy)
  disputes!: Dispute[];

  @OneToMany(() => Notification, (notification) => notification.user)
  notifications!: Notification[];

  @OneToMany(() => AuditLog, (log) => log.actor)
  auditLogs!: AuditLog[];

  getBadges() {
    const badges: string[] = [];
    if (this.contactVerified) badges.push("Contact Verified");
    if (this.identityStatus === "VERIFIED") badges.push("Identity Verified");
    if (this.professionalStatus === "VERIFIED") badges.push("Professional Verified");
    if (this.identityStatus === "VERIFIED" && this.professionalStatus === "VERIFIED") {
      badges.push("Trusted Provider");
    }
    return badges;
  }
}
