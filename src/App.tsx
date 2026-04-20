import React, { useState, useCallback } from 'react';
import { Toaster, toast } from 'react-hot-toast';
import { Search, Plus, ScanLine, Library as LibraryIcon, Loader2, ListFilter } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { supabase } from './lib/supabase';
import { lookupISBN } from './services/isbnService';
import { Book } from './types';
import BookSearch from './components/BookSearch';
import BookForm from './components/BookForm';
import BarcodeScanner from './components/BarcodeScanner';
import { cn } from './lib/utils';

type Tab = 'search' | 'add' | 'scan';

export default function App() {
  const [activeTab, setActiveTab] = useState<Tab>('add');
  const [isLookupLoading, setIsLookupLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isbnResults, setIsbnResults] = useState<Partial<Book>[]>([]);
  const [selectedBookData, setSelectedBookData] = useState<Partial<Book> | null>(null);

  const handleScan = useCallback(async (isbn: string) => {
    toast.success(`Barcode Scanned: ${isbn}`);
    setIsLookupLoading(true);
    try {
      const results = await lookupISBN(isbn);
      if (results.length === 1) {
        setSelectedBookData(results[0]);
        setActiveTab('add');
      } else if (results.length > 1) {
        setIsbnResults(results);
      } else {
        toast.error("No book details found for this ISBN. Entering manually.");
        setSelectedBookData({ isbn });
        setActiveTab('add');
      }
    } catch (err) {
      toast.error("Error looking up ISBN details.");
    } finally {
      setIsLookupLoading(false);
    }
  }, []);

  const handleManualISBN = async (isbn: string) => {
    if (!isbn) return;
    setIsLookupLoading(true);
    try {
      const results = await lookupISBN(isbn);
      if (results.length > 0) {
        setIsbnResults(results);
      } else {
        toast.error("No results found.");
      }
    } catch (err) {
      toast.error("Lookup failed.");
    } finally {
      setIsLookupLoading(false);
    }
  };

  const handleSaveBook = async (book: Book) => {
    setIsSaving(true);
    try {
      const { error } = await supabase.from('books').insert([book]);
      if (error) throw error;
      toast.success("Book saved successfully!", {
        icon: '📚',
        style: { borderRadius: '6px', background: '#0d9488', color: '#fff' }
      });
      setSelectedBookData(null);
      setActiveTab('search');
    } catch (err: any) {
      toast.error(`Error: ${err.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  const tabTitles = {
    search: "Catalog Search",
    add: "Book Registration",
    scan: "Barcode Scanner"
  };

  const tabSubtitles = {
    search: "Browse and search the library inventory",
    add: "Manual entry and ISBN automated lookup",
    scan: "Position the book barcode within the frame"
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col md:flex-row">
      <Toaster position="top-center" />

      {/* Sidebar - Desktop Only */}
      <aside className="hidden md:flex w-64 bg-slate-900 text-white flex-col p-6 shrink-0 h-screen sticky top-0">
        <div className="mb-10">
          <div className="font-extrabold text-base text-brand-light flex items-center gap-2">
            <LibraryIcon className="w-5 h-5" />
            GV KONDAZHY
          </div>
          <div className="text-[10px] opacity-60 font-bold uppercase tracking-widest mt-1">LIBRARY MANAGEMENT</div>
        </div>

        <nav className="flex-1 space-y-1">
          <SidebarNavItem 
            active={activeTab === 'add'} 
            onClick={() => setActiveTab('add')} 
            icon={<Plus className="w-4 h-4" />} 
            label="Add New Book" 
          />
          <SidebarNavItem 
            active={activeTab === 'search'} 
            onClick={() => setActiveTab('search')} 
            icon={<Search className="w-4 h-4" />} 
            label="Catalog Search" 
          />
          <SidebarNavItem 
            active={activeTab === 'scan'} 
            onClick={() => setActiveTab('scan')} 
            icon={<ScanLine className="w-4 h-4" />} 
            label="Barcode Scanner" 
          />
        </nav>

        <div className="mt-auto">
          <div className="text-[11px] text-slate-400 font-bold mb-2 uppercase tracking-wider">DB STATUS</div>
          <div className="flex items-center gap-2 text-xs font-medium">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            Supabase Connected
          </div>
        </div>
      </aside>

      <div className="flex-1 flex flex-col">
        {/* Header */}
        <header className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between sticky top-0 z-40">
          <div>
            <h1 className="text-lg font-bold text-slate-900 m-0">{tabTitles[activeTab]}</h1>
            <p className="text-xs text-slate-500 m-0">{tabSubtitles[activeTab]}</p>
          </div>
          <div className="hidden sm:flex gap-3">
             <button 
              onClick={() => { setSelectedBookData(null); setActiveTab(activeTab === 'add' ? 'scan' : 'add'); }}
              className="px-4 py-2 bg-slate-500 text-white rounded-md text-sm font-semibold hover:opacity-90 transition-all flex items-center gap-2"
            >
              Reset
            </button>
            <button 
              onClick={() => setActiveTab('add')}
              className="px-4 py-2 bg-brand text-white rounded-md text-sm font-semibold hover:opacity-90 transition-all flex items-center gap-2"
            >
              New Entry
            </button>
          </div>
        </header>

        <main className="flex-1 p-6 max-w-5xl md:mx-0">
          <AnimatePresence mode="wait">
            {/* TAB: SEARCH */}
            {activeTab === 'search' && (
              <motion.div
                key="search"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
              >
                <BookSearch />
              </motion.div>
            )}

            {/* TAB: SCAN */}
            {activeTab === 'scan' && (
              <motion.div
                key="scan"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="grid grid-cols-1 md:grid-cols-2 gap-6"
              >
                {/* Scanner Content */}
                <div className="bg-white rounded-xl shadow-card p-6 border border-slate-200">
                  <h2 className="text-sm font-bold m-0 mb-4 bg-slate-50 -mx-6 -mt-6 p-4 rounded-t-xl border-b border-slate-100 uppercase tracking-wider text-slate-500">Fast ISBN Scan</h2>
                  <BarcodeScanner onScan={handleScan} isScanning={activeTab === 'scan'} />
                  
                  <div className="mt-6 p-4 bg-teal-50 rounded-lg border border-teal-100">
                    <p className="text-[10px] text-teal-800 font-bold uppercase tracking-widest text-center">Instruction</p>
                    <p className="text-xs text-teal-700 mt-1 text-center font-medium">Position the book barcode inside the central frame for rapid detection.</p>
                  </div>
                </div>

                {/* Manual lookup as part of scanner tab in sleek theme */}
                <div className="space-y-6">
                   <div className="bg-white rounded-xl shadow-card p-6 border border-slate-200">
                    <h2 className="text-sm font-bold m-0 mb-4 uppercase tracking-wider text-slate-500">Manual ISBN Search</h2>
                    <div className="flex gap-2">
                       <input 
                        type="text" 
                        id="manual-isbn"
                        placeholder="Enter ISBN..." 
                        className="flex-1 px-3 py-2 text-sm rounded-md border border-slate-300 bg-slate-50 focus:ring-1 focus:ring-brand outline-none transition-all"
                      />
                      <button 
                        onClick={() => {
                          const input = document.getElementById('manual-isbn') as HTMLInputElement;
                          handleManualISBN(input.value);
                        }}
                        className="px-4 py-2 bg-slate-600 text-white rounded-md text-sm font-bold hover:opacity-90"
                      >
                        Lookup
                      </button>
                    </div>
                  </div>

                  {/* ISBN Results if any */}
                   {isbnResults.length > 0 && (
                     <div className="bg-white rounded-xl shadow-card p-6 border border-slate-200">
                       <div className="flex justify-between items-center mb-4">
                         <h2 className="text-sm font-bold m-0 uppercase tracking-wider text-slate-500">Lookup Results</h2>
                         <span className="text-[10px] px-2 py-0.5 bg-brand text-white rounded uppercase font-bold">{isbnResults.length} Found</span>
                       </div>
                       <div className="space-y-2 max-h-60 overflow-y-auto custom-scrollbar">
                         {isbnResults.map((result, idx) => (
                           <div
                             key={idx}
                             onClick={() => {
                               setSelectedBookData(result);
                               setIsbnResults([]);
                               setActiveTab('add');
                             }}
                             className="flex flex-col p-3 rounded-lg border border-slate-200 cursor-pointer hover:border-brand hover:bg-teal-50 transition-all group"
                           >
                             <div className="font-bold text-xs text-slate-800">{result.title}</div>
                             <div className="text-[11px] text-slate-500">{result.author} | {result.publisher}</div>
                             <div className="flex gap-2 mt-2">
                               <span className="text-[9px] bg-slate-100 text-slate-600 px-2 rounded font-bold">{result.isbn}</span>
                               <span className="text-[9px] bg-slate-100 text-slate-600 px-2 rounded font-bold uppercase">{result.language}</span>
                             </div>
                           </div>
                         ))}
                       </div>
                     </div>
                   )}
                </div>
              </motion.div>
            )}

            {/* TAB: ADD */}
            {activeTab === 'add' && (
              <motion.div
                key="add"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="max-w-3xl"
              >
                <div className="bg-white rounded-xl shadow-card p-8 border border-slate-200">
                  <h2 className="text-sm font-bold m-0 mb-6 bg-slate-50 -mx-8 -mt-8 p-4 rounded-t-xl border-b border-slate-100 uppercase tracking-wider text-slate-500 flex justify-between items-center">
                    Book Information
                    {selectedBookData && <span className="text-[10px] text-brand lowercase font-normal italic">fields pre-populated from lookup</span>}
                  </h2>
                  <BookForm 
                    initialData={selectedBookData || {}} 
                    onSave={handleSaveBook} 
                    onCancel={() => { setSelectedBookData(null); setActiveTab('search'); }}
                    isLoading={isSaving}
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </main>
      </div>

      {/* Loading Overlay */}
      {isLookupLoading && (
        <div className="fixed inset-0 z-[60] flex flex-col items-center justify-center bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white p-8 rounded-2xl shadow-2xl flex flex-col items-center space-y-4">
            <motion.div 
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
              className="w-10 h-10 border-4 border-brand border-t-transparent rounded-full"
            />
            <div className="text-center">
              <p className="text-sm font-bold text-slate-900">Searching Databases...</p>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Indian & Global Sources</p>
            </div>
          </div>
        </div>
      )}

      {/* Mobile Navigation */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-slate-200 px-6 py-4 flex items-center justify-around shadow-[0_-4px_20px_rgba(0,0,0,0.05)]">
        <NavButton 
          active={activeTab === 'search'} 
          onClick={() => setActiveTab('search')} 
          icon={<Search className="w-5 h-5" />} 
          label="Catalog" 
        />
        <NavButton 
          active={activeTab === 'add'} 
          onClick={() => { setSelectedBookData(null); setActiveTab('add'); }} 
          icon={<Plus className="w-5 h-5" />} 
          label="Add" 
        />
        <NavButton 
          active={activeTab === 'scan'} 
          onClick={() => setActiveTab('scan')} 
          icon={<ScanLine className="w-5 h-5" />} 
          label="Scanner" 
        />
      </nav>
    </div>
  );
}

function SidebarNavItem({ active, onClick, icon, label }: { active: boolean, onClick: () => void, icon: React.ReactNode, label: string }) {
  return (
    <button 
      onClick={onClick}
      className={cn(
        "w-full flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium transition-all group",
        active ? "bg-white/10 text-white" : "text-slate-400 hover:bg-white/5 hover:text-slate-200"
      )}
    >
      <span className={cn(
        "transition-colors",
        active ? "text-brand-light" : "text-slate-500 group-hover:text-slate-300"
      )}>
        {icon}
      </span>
      {label}
    </button>
  );
}

function NavButton({ active, onClick, icon, label }: { active: boolean, onClick: () => void, icon: React.ReactNode, label: string }) {
  return (
    <button 
      onClick={onClick}
      className={cn(
        "flex flex-col items-center gap-1 transition-all",
        active ? "text-brand" : "text-slate-400 hover:text-slate-600"
      )}
    >
      <div className={cn(
        "p-1.5 transition-all outline-none",
      )}>
        {icon}
      </div>
      <span className="text-[9px] font-bold uppercase tracking-wider">{label}</span>
    </button>
  );
}
