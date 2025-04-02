import { Args, ID, Mutation, Query, Resolver } from '@nestjs/graphql';
import { BooksService } from './books.service';
import { CreateBookInput, UpdateBookInput } from '../graphql';
import { Book, Prisma } from '@prisma/client';

@Resolver('Book')
export class BooksResolver {
  constructor(private readonly booksService: BooksService) {}

  @Mutation('createBook')
  createBook(@Args('createBookInput') createBookInput: CreateBookInput): Promise<Book> {
    return this.booksService.create(createBookInput);
  }

  @Query('books')
  findAll(): Promise<Book[]> {
    return this.booksService.findAll();
  }

  @Query('book')
  findOne(@Args('id') id: string): Promise<Book | null> {
    return this.booksService.findOne(id);
  }

  @Mutation('updateBook')
  updateBook(
    @Args('id') id: string,
    @Args('updateBookInput') updateBookInput: Prisma.BookUpdateInput,
  ): Promise<Book> {
    return this.booksService.update(id, updateBookInput);
  }

  @Mutation('removeBook')
  removeBook(@Args('id') id: string): Promise<Book> {
    return this.booksService.remove(id);
  }
}
