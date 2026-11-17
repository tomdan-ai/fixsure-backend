import "reflect-metadata";
import { Entity, PrimaryColumn, Column, ManyToOne, OneToMany } from "typeorm";
import { User } from "./User";

@Entity()
export class TechnicianProfile {
  @PrimaryColumn("uuid")
  id!: string;

  @Column()
  userId!: string;

  @ManyToOne(() => User, (user) => user.technicianProfile)
  user!: User;

  @Column("jsonb")
  categories!: string[];

  @Column()
  city!: string;

  @Column()
  bio!: string;

  @Column()
  professionalStatus!: string;
}