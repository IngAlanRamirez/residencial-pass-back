import { Injectable, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Street } from '../database/entities';

@Injectable()
export class StreetsService {
  constructor(
    @InjectRepository(Street)
    private readonly streetRepository: Repository<Street>,
  ) {}

  async create(name: string): Promise<Street> {
    const normalized = name.trim();
    const existing = await this.streetRepository.findOne({
      where: { name: normalized },
    });
    if (existing) {
      throw new ConflictException('Ya existe una calle con ese nombre');
    }
    const street = this.streetRepository.create({ name: normalized });
    return this.streetRepository.save(street);
  }

  async findAll(): Promise<Street[]> {
    return this.streetRepository.find({
      order: { name: 'ASC' },
    });
  }
}
