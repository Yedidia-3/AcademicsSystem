import { Column, CreateDateColumn, Entity, Index, ManyToOne, OneToMany, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { AcademicYear } from './academic-year.entity';
import { Class } from './class.entity';
import { ShuffleSession } from './shuffle-session.entity';

@Entity('p_levels')
export class PLevel {
  @PrimaryGeneratedColumn()
  id: number;

  @Index()
  @Column()
  academic_year_id: number;

  @Column({ length: 10 })
  name: string;

  @Column({ type: 'enum', enum: ['active', 'inactive'], default: 'active' })
  status: 'active' | 'inactive';

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  @ManyToOne(() => AcademicYear, (ay) => ay.p_levels, { onDelete: 'CASCADE' })
  academic_year: AcademicYear;

  @OneToMany(() => Class, (c) => c.p_level)
  classes: Class[];

  @OneToMany(() => ShuffleSession, (ss) => ss.p_level)
  shuffle_sessions: ShuffleSession[];
}
