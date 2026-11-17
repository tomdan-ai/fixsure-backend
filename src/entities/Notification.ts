import "reflect-metadata";
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from "typeorm";
import { User } from "./User";

@Entity()
export class Notification {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  userId!: string;

  @Column()
  message!: string;

  @Column({ default: false })
  read!: boolean;

  @Column({ type: "timestamptz", default: () => "CURRENT_TIMESTAMP" })
  createdAt!: Date;

  @ManyToOne(() => User, (user) => user.notifications, { nullable: true })
  @JoinColumn({ name: "userId" })
  user!: User;
}
