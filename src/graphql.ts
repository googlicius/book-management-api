
/*
 * -------------------------------------------------------
 * THIS FILE WAS AUTOMATICALLY GENERATED (DO NOT MODIFY)
 * -------------------------------------------------------
 */

/* tslint:disable */
/* eslint-disable */

export interface CreateAuthorInput {
    name: string;
    email: string;
}

export interface UpdateAuthorInput {
    name?: Nullable<string>;
    email?: Nullable<string>;
}

export interface CreateBookInput {
    title: string;
    description?: Nullable<string>;
    publishedAt: DateTime;
    authorId: string;
}

export interface UpdateBookInput {
    title?: Nullable<string>;
    description?: Nullable<string>;
    publishedAt?: Nullable<DateTime>;
    authorId?: Nullable<string>;
}

export interface Author {
    id: string;
    name: string;
    email: string;
    books?: Nullable<Book[]>;
    createdAt: DateTime;
    updatedAt: DateTime;
}

export interface IQuery {
    authors(): Author[] | Promise<Author[]>;
    author(id: string): Nullable<Author> | Promise<Nullable<Author>>;
    books(): Book[] | Promise<Book[]>;
    book(id: string): Nullable<Book> | Promise<Nullable<Book>>;
}

export interface IMutation {
    createAuthor(createAuthorInput: CreateAuthorInput): Author | Promise<Author>;
    updateAuthor(id: string, updateAuthorInput: UpdateAuthorInput): Author | Promise<Author>;
    removeAuthor(id: string): Author | Promise<Author>;
    createBook(createBookInput: CreateBookInput): Book | Promise<Book>;
    updateBook(id: string, updateBookInput: UpdateBookInput): Book | Promise<Book>;
    removeBook(id: string): Book | Promise<Book>;
}

export interface Book {
    id: string;
    title: string;
    description?: Nullable<string>;
    publishedAt: DateTime;
    author: Author;
    authorId: string;
    createdAt: DateTime;
    updatedAt: DateTime;
}

export type DateTime = any;
type Nullable<T> = T | null;
