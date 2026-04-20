import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Book } from '../types';
import { Search, Book as BookIcon, ChevronRight, Hash, Library } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

import { Toaster, toast } from 'react-hot-toast';

export default function BookSearch() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Book[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      if (query.trim()) {
        searchBooks();
      } else {
        setResults([]);
      }
    }, 300);

    return () => clearTimeout(delayDebounce);
  }, [query]);

  const searchBooks = async () => {
    setIsSearching(true);
    try {
      const { data, error } = await supabase
        .from('books')
        .select('*')
        .or(`title.ilike.%${query}%,author.ilike.%${query}%,stocknumber.ilike.%${query}%,callnumber.ilike.%${query}%`)
        .limit(20);

      if (error) throw error;
      setResults(data || []);
    } catch (err: any) {
      console.error('Search error:', err);
      if (err.message === 'Failed to fetch') {
        toast.error("Database Connection Failed. Check your API Keys.");
      } else {
        toast.error(`Search Error: ${err.message}`);
      }
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="relative group">
        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-brand transition-colors">
          <Search className="w-5 h-5" />
        </div>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by title, author, stock # or call #..."
          className="w-full pl-11 pr-4 py-3 rounded-lg border border-slate-200 bg-white focus:ring-1 focus:ring-brand focus:border-brand outline-none transition-all text-sm shadow-sm"
        />
        {isSearching && (
          <div className="absolute inset-y-0 right-0 pr-4 flex items-center">
            <div className="w-4 h-4 border-2 border-brand border-t-transparent rounded-full animate-spin"></div>
          </div>
        )}
      </div>

      <div className="grid gap-3">
        <AnimatePresence mode="popLayout">
          {results.length > 0 ? (
            results.map((book) => (
              <motion.div
                key={book.id}
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.98 }}
                className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm hover:border-brand hover:bg-teal-50/30 transition-all cursor-pointer flex items-center gap-4 group"
              >
                <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center text-slate-400 group-hover:bg-brand group-hover:text-white transition-all shrink-0">
                  <BookIcon className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-sm text-slate-900 truncate leading-tight">{book.title}</h3>
                  <p className="text-[11px] text-slate-500 truncate mt-0.5">{book.author}</p>
                  <div className="flex flex-wrap gap-2 mt-2">
                    <span className="text-[10px] bg-slate-100 text-slate-600 px-2 rounded font-bold uppercase tracking-tight flex items-center gap-1">
                       {book.stocknumber}
                    </span>
                    <span className="text-[10px] bg-slate-100 text-slate-600 px-2 rounded font-bold uppercase tracking-tight flex items-center gap-1">
                      Shelf {book.shelfnumber}
                    </span>
                    <span className="text-[10px] bg-brand/10 text-brand px-2 rounded font-bold uppercase tracking-tight">
                      {book.language}
                    </span>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-brand transition-colors" />
              </motion.div>
            ))
          ) : query && !isSearching ? (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-12 text-slate-400 text-sm italic"
            >
              No books found matching "{query}"
            </motion.div>
          ) : null}
        </AnimatePresence>
      </div>
    </div>
  );
}
