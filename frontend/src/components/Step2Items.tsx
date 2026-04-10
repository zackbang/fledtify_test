import { useState, useEffect, useRef } from 'react';
import { useInvoiceStore } from '@/store/useInvoiceStore';
import api from '@/lib/axios';

interface ItemData {
  id?: number;
  ID?: number;
  code?: string;
  Code?: string;
  name?: string;
  Name?: string;
  price?: number;
  Price?: number;
}

export default function Step2Items() {
  const state = useInvoiceStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [results, setResults] = useState<ItemData[]>([]);
  const [loading, setLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [catalog, setCatalog] = useState<ItemData[]>([]);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // fetch catalog
  useEffect(() => {
    const fetchCatalog = async () => {
      try {
        const res = await api.get('/items'); 
        const itemsData = res.data.data || res.data || [];
        setCatalog(Array.isArray(itemsData) ? itemsData : []);
      } catch (error) {
        console.error("Gagal memuat katalog", error);
      }
    };
    fetchCatalog();
  }, []);

  // debounce & abort search
  useEffect(() => {
    if (!searchTerm.trim()) {
      setResults([]);
      setShowDropdown(false);
      return;
    }

    const abortController = new AbortController();
    const timeoutId = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await api.get(`/items?code=${searchTerm}`, { signal: abortController.signal });
        const itemsData = res.data.data || res.data || [];
        setResults(Array.isArray(itemsData) ? itemsData : []);
        setShowDropdown(true);
      } catch (error) {
        if (error instanceof Error && error.name !== 'CanceledError') console.error(error);
      } finally {
        setLoading(false);
      }
    }, 500);

    return () => {
      clearTimeout(timeoutId);
      abortController.abort();
    };
  }, [searchTerm]);

  const handleSelectItem = (item: ItemData) => {
    state.addItem({
      itemId: item.id || item.ID || 0,
      code: item.code || item.Code || 'UNKNOWN',
      name: item.name || item.Name || 'Unknown Item',
      price: item.price || item.Price || 0,
      quantity: 1 
    });
    setSearchTerm(''); 
    setShowDropdown(false); 
  };

  return (
    <div className="space-y-6">
      
      {/* Catalog */}
      {catalog.length > 0 && (
        <div className="bg-gray-50 border border-gray-200 p-4 rounded-lg">
          <h3 className="text-xs font-black text-gray-500 mb-3 uppercase tracking-widest">
            📋 Katalog Referensi (Gunakan kolom cari untuk menambah)
          </h3>
          <div className="flex flex-wrap gap-2">
            {catalog.map((item, idx) => (
              <div
                key={idx}
                className="bg-white border border-gray-300 text-gray-700 px-3 py-1 rounded-md text-[11px] font-bold shadow-sm flex items-center gap-2 cursor-default"
              >
                <span className="text-blue-600">[{item.code || item.Code}]</span>
                <span>{item.name || item.Name}</span>
                <span className="text-gray-400">|</span>
                <span>Rp {(item.price || item.Price || 0).toLocaleString('id-ID')}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Search */}
      <div className="relative" ref={dropdownRef}>
        <label className="block text-sm font-black text-black mb-2 uppercase tracking-wide">
          Cari & Tambah Barang
        </label>
        <div className="relative">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Ketik kode barang (Contoh: B001)..."
            className="w-full p-4 border-2 border-gray-300 rounded-xl text-black font-bold focus:border-blue-600 outline-none transition-all pl-12"
          />
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xl">🔍</span>
        </div>
        
        {loading && <p className="text-xs text-blue-600 font-bold mt-1 animate-pulse">Mencari di database...</p>}

        {showDropdown && results.length > 0 && (
          <div className="absolute z-20 w-full mt-2 bg-white border-2 border-gray-300 rounded-xl shadow-2xl max-h-60 overflow-y-auto">
            {results.map((item, idx) => (
              <div 
                key={idx} 
                onClick={() => handleSelectItem(item)} 
                className="p-4 hover:bg-blue-600 hover:text-white cursor-pointer border-b border-gray-100 flex justify-between items-center transition-colors group"
              >
                <div>
                  <p className="font-black text-lg group-hover:text-white text-black">{item.code || item.Code}</p>
                  <p className="text-sm font-medium">{item.name || item.Name}</p>
                </div>
                <div className="text-right">
                  <p className="font-black text-green-600 group-hover:text-white">Rp {(item.price || item.Price || 0).toLocaleString('id-ID')}</p>
                  <p className="text-[10px] uppercase font-bold opacity-60">Klik untuk tambah</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Cart */}
      <div className="mt-8 border-2 border-gray-300 rounded-xl overflow-hidden shadow-sm bg-white">
        <table className="w-full text-left">
          <thead className="bg-gray-800 text-white uppercase text-[10px] tracking-widest font-black">
            <tr>
              <th className="p-4">Item</th>
              <th className="p-4 text-center">Jumlah</th>
              <th className="p-4 text-right">Harga Satuan</th>
              <th className="p-4 text-center">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 text-black font-medium">
            {state.items.length === 0 ? (
              <tr>
                <td colSpan={4} className="p-12 text-center text-gray-400 font-bold italic">
                  Belum ada barang yang terpilih. Silakan cari barang di atas.
                </td>
              </tr>
            ) : (
              state.items.map((item, idx) => (
                <tr key={idx} className="hover:bg-gray-50 transition-colors">
                  <td className="p-4">
                    <div className="font-black text-blue-700">{item.code}</div>
                    <div className="text-sm text-gray-600">{item.name}</div>
                  </td>
                  <td className="p-4 text-center">
                    <div className="inline-flex items-center gap-3 bg-gray-100 rounded-full px-3 py-1 border border-gray-300">
                      <button 
                        onClick={() => {
                          if (item.quantity > 1) {
                            const newItems = [...state.items];
                            newItems[idx].quantity -= 1;
                            state.setClientData({ items: newItems });
                          } else {
                            state.removeItem(idx);
                          }
                        }}
                        className="text-gray-500 hover:text-red-600 font-black text-lg w-5"
                      >−</button>
                      <span className="font-black text-sm w-4">{item.quantity}</span>
                      <button 
                        onClick={() => {
                          const newItems = [...state.items];
                          newItems[idx].quantity += 1;
                          state.setClientData({ items: newItems });
                        }}
                        className="text-gray-500 hover:text-green-600 font-black text-lg w-5"
                      >+</button>
                    </div>
                  </td>
                  <td className="p-4 text-right font-bold">
                    Rp {(item.price || 0).toLocaleString('id-ID')}
                  </td>
                  <td className="p-4 text-center">
                    <button 
                      onClick={() => state.removeItem(idx)} 
                      className="text-red-500 hover:bg-red-50 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-tighter transition-all"
                    >
                      Hapus
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* --- BAGIAN 4: NAVIGASI --- */}
      <div className="flex justify-between items-center pt-8 mt-6 border-t-2 border-gray-100">
        <button onClick={() => state.setStep(1)} className="text-gray-400 hover:text-black font-black uppercase text-xs tracking-widest transition-colors">
          ← Kembali
        </button>
        <button 
          onClick={() => state.setStep(3)} 
          disabled={state.items.length === 0}
          className="bg-blue-600 text-white px-10 py-4 rounded-xl hover:bg-blue-800 disabled:bg-gray-200 disabled:text-gray-400 font-black uppercase tracking-widest shadow-xl transform active:scale-95 transition-all"
        >
          Selanjutnya →
        </button>
      </div>

    </div>
  );
}