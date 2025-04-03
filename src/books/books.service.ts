import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { CreateBookInput } from '../graphql';
import { Book, Prisma } from '@prisma/client';

@Injectable()
export class BooksService {
  constructor(private prisma: PrismaService) {}

  create(createBookInput: CreateBookInput): Promise<Book> {
    return this.prisma.book.create({
      data: createBookInput,
      include: {
        author: true,
      },
    });
  }

  findAll(): Promise<Book[]> {
    return this.prisma.book.findMany({
      include: {
        author: true,
      },
    });
  }

  findOne(id: string): Promise<Book | null> {
    return this.prisma.book.findUnique({
      where: { id },
      include: {
        author: true,
      },
    });
  }

  update(id: string, updateBookInput: Prisma.BookUpdateInput): Promise<Book> {
    return this.prisma.book.update({
      where: { id },
      data: updateBookInput,
      include: {
        author: true,
      },
    });
  }

  remove(id: string): Promise<Book> {
    return this.prisma.book.delete({
      where: { id },
    });
  }
}
