import { Args, ID, Mutation, Query, Resolver } from '@nestjs/graphql';
import { AuthorsService } from './authors.service';
import { Author, CreateAuthorInput } from '../graphql';
import { Prisma } from '@prisma/client';

@Resolver('Author')
export class AuthorsResolver {
  constructor(private readonly authorsService: AuthorsService) {}

  @Mutation('createAuthor')
  createAuthor(@Args('createAuthorInput') createAuthorInput: CreateAuthorInput): Promise<Author> {
    return this.authorsService.create(createAuthorInput);
  }

  @Query('authors')
  findAll(): Promise<Author[]> {
    return this.authorsService.findAll();
  }

  @Query('author')
  findOne(@Args('id') id: string): Promise<Author | null> {
    return this.authorsService.findOne(id);
  }

  @Mutation('updateAuthor')
  updateAuthor(
    @Args('id') id: string,
    @Args('updateAuthorInput') updateAuthorInput: Prisma.AuthorUpdateInput,
  ): Promise<Author> {
    return this.authorsService.update(id, updateAuthorInput);
  }

  @Mutation('removeAuthor')
  removeAuthor(@Args('id') id: string): Promise<Author> {
    return this.authorsService.remove(id);
  }
}
