import { Book } from '../types';

export const sampleBooks: Book[] = [
  {
    id: '123e4567-e89b-12d3-a456-426614174000',
    title: 'The Name of the Wind',
    author: 'Patrick Rothfuss',
    cover_url: 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=60',
    description: 'A young man grows to become a legendary wizard',
    isbn: '9780756404741',
    publication_year: 2007,
    genres: ['Fantasy', 'Adventure']
  },
  {
    id: '123e4567-e89b-12d3-a456-426614174001',
    title: 'Dune',
    author: 'Frank Herbert',
    cover_url: 'https://images.unsplash.com/photo-1531425300797-d5dc8b021c84?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=60',
    description: 'A science fiction masterpiece about power and destiny',
    isbn: '9780441172719',
    publication_year: 1965,
    genres: ['Science Fiction', 'Space Opera']
  },
  {
    id: '123e4567-e89b-12d3-a456-426614174002',
    title: 'Project Hail Mary',
    author: 'Andy Weir',
    cover_url: 'https://images.unsplash.com/photo-1512820790803-83ca734da794?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=60',
    description: 'An astronaut must save humanity from extinction',
    isbn: '9780593135204',
    publication_year: 2021,
    genres: ['Science Fiction', 'Space Opera']
  },
  {
    id: '123e4567-e89b-12d3-a456-426614174003',
    title: 'The Way of Kings',
    author: 'Brandon Sanderson',
    cover_url: 'https://images.unsplash.com/photo-1535905557558-afc4877a26fc?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=60',
    description: 'Epic fantasy in a world of storms and magic',
    isbn: '9780765326355',
    publication_year: 2010,
    genres: ['Fantasy', 'Epic Fantasy']
  },
  {
    id: '123e4567-e89b-12d3-a456-426614174004',
    title: 'Neuromancer',
    author: 'William Gibson',
    cover_url: 'https://images.unsplash.com/photo-1519638831568-d9897f54ed69?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=60',
    description: 'A groundbreaking cyberpunk novel',
    isbn: '9780441569595',
    publication_year: 1984,
    genres: ['Science Fiction', 'Cyberpunk']
  }
];