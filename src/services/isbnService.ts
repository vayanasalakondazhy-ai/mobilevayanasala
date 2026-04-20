import { GoogleGenAI } from "@google/genai";
import { Book } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export async function lookupISBN(isbn: string): Promise<Partial<Book>[]> {
  const sanitizeISBN = isbn.replace(/[^0-9X]/gi, '');
  const results: Partial<Book>[] = [];

  try {
    // 1. Google Books API
    const googleResponse = await fetch(`https://www.googleapis.com/books/v1/volumes?q=isbn:${sanitizeISBN}`);
    const googleData = await googleResponse.json();
    
    if (googleData.items) {
      googleData.items.forEach((item: any) => {
        const info = item.volumeInfo;
        results.push({
          title: info.title || '',
          author: info.authors ? info.authors.join(', ') : '',
          publisher: info.publisher || '',
          isbn: sanitizeISBN,
          category: info.categories ? info.categories[0] : '',
          language: info.language === 'ml' ? 'MALAYALAM' : info.language === 'en' ? 'ENGLISH' : 'OTHER'
        });
      });
    }

    // 2. Open Library API
    const olResponse = await fetch(`https://openlibrary.org/api/books?bibkeys=ISBN:${sanitizeISBN}&format=json&jscmd=data`);
    const olData = await olResponse.json();
    const olKey = `ISBN:${sanitizeISBN}`;
    
    if (olData[olKey]) {
      const info = olData[olKey];
      results.push({
        title: info.title || '',
        author: info.authors ? info.authors.map((a: any) => a.name).join(', ') : '',
        publisher: info.publishers ? info.publishers.map((p: any) => p.name).join(', ') : '',
        isbn: sanitizeISBN,
        language: 'OTHER' // Open library doesn't always have normalized language
      });
    }

    // 3. AI Fallback for Indian/Specific databases if APIs fail or return little data
    // We can ask Gemini to "hallucinate" high-probability data or guide the user
    // if we had a way to scrape RRRNA, we'd do it here, but CORS is an issue.
    // Instead, we use Gemini to "refine" and "search" by proxy if the user wants.
    
    if (results.length === 0) {
      const aiResponse = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `Find book details for ISBN: ${sanitizeISBN}. Search in your knowledge base (include Indian databases like RRRNA). Output JSON: { "title": string, "author": string, "publisher": string, "language": "MALAYALAM" | "ENGLISH" | "HINDI" | "TAMIL" | "SANSKRIT" | "OTHER", "category": string }`,
        config: {
          responseMimeType: "application/json"
        }
      });
      
      try {
        const parsed = JSON.parse(aiResponse.text);
        if (parsed.title) {
          results.push({
            ...parsed,
            isbn: sanitizeISBN
          });
        }
      } catch (e) {
        console.error("AI ISBN parsing failed", e);
      }
    }

  } catch (error) {
    console.error('ISBN lookup error:', error);
  }

  // Deduplicate results roughly by title
  const uniqueResults = Array.from(new Map(results.map(item => [item.title?.toLowerCase(), item])).values());
  return uniqueResults;
}
