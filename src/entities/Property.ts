import "reflect-metadata";
import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany, JoinColumn } from "typeorm";
import { User } from "./User";
import { MaintenanceRequest } from "./MaintenanceRequest";

@Entity()
export class Property {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column()
  name!: string;

  @Column()
  address!: string;

  @Column()
  city!: string;

  @Column()
  managerId!: string;

  @ManyToOne(() => User, (user) => user.managedProperties)
  @JoinColumn({ name: "managerId" })
  manager!: User;

  @OneToMany(() => MaintenanceRequest, (request) => request.property)
  requests!: MaintenanceRequest[];
}
