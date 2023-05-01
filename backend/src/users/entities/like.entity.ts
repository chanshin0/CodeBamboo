import { Timestamp } from 'typeorm';
import {
  Entity,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
} from 'typeorm';
import { User } from 'src/users/entities/user.entity';
// import Leaf from 'LEAF_ENTITY_ADDRESS';

@Entity()
export class Like {
  @PrimaryGeneratedColumn({
    type: 'bigint',
  })
  bookmark_id: number;

  @CreateDateColumn()
  creation_time: Timestamp;

  @ManyToOne(() => User, (user) => user.likes, {
    onDelete: 'CASCADE',
    eager: true,
  })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @ManyToOne(() => Leaf, (leaf) => leaf.likes, {
    onDelete: 'CASCADE',
    eager: true,
  })
  @JoinColumn({ name: 'leaf_id' })
  leaf: Leaf;
}
