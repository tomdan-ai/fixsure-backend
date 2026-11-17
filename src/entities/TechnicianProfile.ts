import "reflect-metadata";
import { Entity, PrimaryGeneratedColumn, Column, OneToOne, JoinColumn } from "typeorm";
import { User } from "./User";

@Entity()
export class TechnicianProfile {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column()
  userId!: string;

  @OneToOne(() => User, (user) => user.technicianProfile)
  @JoinColumn({ name: "userId" })
  user!: User;

  @Column("jsonb", { default: [] })
  categories!: string[];

  @Column({ default: "" })
  city!: string;

  @Column({ default: "" })
  bio!: string;

  @Column({ default: "NOT_STARTED" })
  professionalStatus!: string;
}
