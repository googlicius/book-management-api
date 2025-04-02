import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { CreateAuthorInput } from '../graphql';
import { Author, Prisma } from '@prisma/client';

@Injectable()
export class AuthorsService {
  constructor(private prisma: PrismaService) {}

  create(createAuthorInput: CreateAuthorInput): Promise<Author> {
    return this.prisma.author.create({
      data: createAuthorInput,
      include: {
        books: true,
      },
    });
  }

  findAll(): Promise<Author[]> {
    return this.prisma.author.findMany({
      include: {
        books: true,
      },
    });
  }

  findOne(id: string): Promise<Author | null> {
    return this.prisma.author.findUnique({
      where: { id },
      include: {
        books: true,
      },
    });
  }

  update(id: string, updateAuthorInput: Prisma.AuthorUpdateInput): Promise<Author> {
    return this.prisma.author.update({
      where: { id },
      data: updateAuthorInput,
      include: {
        books: true,
      },
    });
  }

  remove(id: string): Promise<Author> {
    return this.prisma.author.delete({
      where: { id },
    });
  }
}
