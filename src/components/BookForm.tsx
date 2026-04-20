import React, { useState, useEffect } from 'react';
import { Book, LANGUAGES, SHELF_NUMBERS } from '../types';
import { cn } from '../lib/utils';
import { Save, Loader2, X } from 'lucide-react';

interface BookFormProps {
  initialData?: Partial<Book>;
  onSave: (book: Book) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
}

export default function BookForm({ initialData, onSave, onCancel, isLoading }: BookFormProps) {
  const [formData, setFormData] = useState<Book>({
    stocknumber: '',
    callnumber: '',
    title: '',
    author: '',
    language: 'MALAYALAM',
    category: '',
    price: '',
    publisher: '',
    shelfnumber: '1',
    isbn: '',
    ...initialData
  });

  useEffect(() => {
    if (initialData) {
      setFormData(prev => ({ ...prev, ...initialData }));
    }
  }, [initialData]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
        {/* Stock & Call Numbers */}
        <div className="space-y-1">
          <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">Stock Number</label>
          <input
            required
            name="stocknumber"
            value={formData.stocknumber}
            onChange={handleChange}
            className="w-full px-3 py-2 text-sm rounded-md border border-slate-300 bg-slate-50 focus:ring-1 focus:ring-brand outline-none transition-all"
            placeholder="STK-0024"
          />
        </div>
        <div className="space-y-1">
          <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">Call Number</label>
          <input
            required
            name="callnumber"
            value={formData.callnumber}
            onChange={handleChange}
            className="w-full px-3 py-2 text-sm rounded-md border border-slate-300 bg-slate-50 focus:ring-1 focus:ring-brand outline-none transition-all"
            placeholder="823.914"
          />
        </div>

        {/* Title & Author */}
        <div className="md:col-span-2 space-y-1">
          <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">Title</label>
          <input
            required
            name="title"
            value={formData.title}
            onChange={handleChange}
            className="w-full px-3 py-2 text-sm rounded-md border border-slate-300 bg-slate-50 focus:ring-1 focus:ring-brand outline-none transition-all font-medium"
            placeholder="Enter book title"
          />
        </div>
        <div className="md:col-span-2 space-y-1">
          <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">Author</label>
          <input
            required
            name="author"
            value={formData.author}
            onChange={handleChange}
            className="w-full px-3 py-2 text-sm rounded-md border border-slate-300 bg-slate-50 focus:ring-1 focus:ring-brand outline-none transition-all"
            placeholder="Enter author name"
          />
        </div>

        {/* Language & Category */}
        <div className="space-y-1">
          <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">Language</label>
          <select
            name="language"
            value={formData.language}
            onChange={handleChange}
            className="w-full px-3 py-2 text-sm rounded-md border border-slate-300 bg-slate-50 focus:ring-1 focus:ring-brand outline-none transition-all"
          >
            {LANGUAGES.map(lang => (
              <option key={lang} value={lang}>{lang}</option>
            ))}
          </select>
        </div>
        <div className="space-y-1">
          <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">Category</label>
          <input
            name="category"
            value={formData.category}
            onChange={handleChange}
            className="w-full px-3 py-2 text-sm rounded-md border border-slate-300 bg-slate-50 focus:ring-1 focus:ring-brand outline-none transition-all"
            placeholder="Fiction / Science"
          />
        </div>

        {/* Publisher & Price */}
        <div className="md:col-span-2 space-y-1">
          <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">Publisher</label>
          <input
            name="publisher"
            value={formData.publisher}
            onChange={handleChange}
            className="w-full px-3 py-2 text-sm rounded-md border border-slate-300 bg-slate-50 focus:ring-1 focus:ring-brand outline-none transition-all"
            placeholder="D.C. Books / Current Books"
          />
        </div>

        <div className="space-y-1">
          <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">Price</label>
          <input
            name="price"
            value={formData.price}
            onChange={handleChange}
            className="w-full px-3 py-2 text-sm rounded-md border border-slate-300 bg-slate-50 focus:ring-1 focus:ring-brand outline-none transition-all"
            placeholder="₹ 0.00"
          />
        </div>
        
        {/* Shelf Number & ISBN */}
        <div className="space-y-1">
          <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">Shelf Number</label>
          <select
            name="shelfnumber"
            value={formData.shelfnumber}
            onChange={handleChange}
            className="w-full px-3 py-2 text-sm rounded-md border border-slate-300 bg-slate-50 focus:ring-1 focus:ring-brand outline-none transition-all"
          >
            {SHELF_NUMBERS.map(num => (
              <option key={num} value={num}>Shelf {num}</option>
            ))}
          </select>
        </div>
        <div className="md:col-span-2 space-y-1">
          <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">ISBN (Optional)</label>
          <input
            name="isbn"
            value={formData.isbn}
            onChange={handleChange}
            className="w-full px-3 py-2 text-sm rounded-md border border-slate-300 bg-slate-50 focus:ring-1 focus:ring-brand outline-none transition-all text-brand font-mono"
            placeholder="978-..."
          />
        </div>
      </div>

      <div className="flex gap-3 pt-8 border-t border-slate-100 mt-6">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 px-4 py-2 rounded-md border border-slate-200 text-slate-600 font-semibold hover:bg-slate-50 transition-all flex items-center justify-center gap-2 text-sm"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isLoading}
          className={cn(
            "flex-[2] px-6 py-2 rounded-md bg-brand text-white font-bold shadow-sm hover:opacity-90 transition-all flex items-center justify-center gap-2 text-sm uppercase tracking-wider",
            isLoading && "opacity-70 cursor-not-allowed"
          )}
        >
          {isLoading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Save className="w-4 h-4" />
          )}
          {isLoading ? "Saving..." : "Save to Database"}
        </button>
      </div>
    </form>
  );
}
