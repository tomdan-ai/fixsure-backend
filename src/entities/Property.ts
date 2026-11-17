import "reflect-metadata";
import { Entity, PrimaryColumn, Column, ManyToOne, OneToMany } from "typeorm";
import { User } from "./User";
import { MaintenanceRequest } from "./MaintenanceRequest";
import { Quote } from "./Quote";

@Entity()
export class Property {
  @PrimaryColumn("uuid")
  id!: number;

  @Column()
  name!: string;

  @Column()
  address!: string;

  @Column()
  city!: string;

  @Column()
  managerId!: string;

  @ManyToOne(() => User, (user) => user.managedProperties)
  manager!: User;

  @OneToMany(() => MaintenanceRequest, (request) => request.property)
  requests!: MaintenanceRequest[];
}