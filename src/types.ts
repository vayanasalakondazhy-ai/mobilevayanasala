export interface Book {
  id?: number;
  stocknumber: string;
  callnumber: string;
  title: string;
  author: string;
  language: string;
  category: string;
  price: string;
  publisher: string;
  shelfnumber: string;
  isbn: string;
  created_at?: string;
}

export const LANGUAGES = [
  'MALAYALAM',
  'ENGLISH',
  'HINDI',
  'TAMIL',
  'SANSKRIT',
  'OTHER'
];

export const SHELF_NUMBERS = Array.from({ length: 30 }, (_, i) => (i + 1).toString());
