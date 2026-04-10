import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useInvoiceStore } from '@/store/useInvoiceStore';
import { useDebounce } from '@/hooks/useDebounce';
import axios from 'axios';

interface ItemType {
  ID: number;
  Code: string;
  Name: string;
  Price: number;
}

export default function Step2Items() {
  const { items, addItem, removeItem, setStep } = useInvoiceStore();
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 500);

  // Fetching data dengan React Query + Abort Signal
  const { data: searchResults, isLoading } = useQuery({
    queryKey: ['items', debouncedSearch],
    queryFn: async ({ signal }) => {
      if (!debouncedSearch) return [];
      const res = await axios.get(`http://localhost:8080/api/items?code=${debouncedSearch}`, { signal });
      return res.data;
    },
    enabled: debouncedSearch.length > 0,
  });

  return (
    <div className="space-y-6">
      {/* Kotak Pencarian */}
      <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
        <label className="block text-base font-bold text-black mb-2">Cari Barang (Ketik Kode, misal: B001)</label>
        <input
          type="text"
          className="w-full p-3 border border-gray-400 rounded-md text-black font-medium focus:ring-blue-600 focus:border-blue-600 outline-none"
          placeholder="Ketik kode barang di sini..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        {isLoading && <p className="text-sm text-black font-medium mt-2 animate-pulse">Sedang mencari di database...</p>}
        
        {/* Hasil Pencarian */}
        <div className="mt-2 bg-white rounded-md shadow-sm border border-gray-300 overflow-hidden">
          {searchResults?.map((item: ItemType) => (
            <button
              key={item.ID}
              onClick={() => {
                addItem({ itemId: item.ID, code: item.Code, name: item.Name, quantity: 1, price: item.Price });
                setSearch('');
              }}
              className="w-full text-left p-3 hover:bg-blue-100 border-b border-gray-200 text-base flex justify-between items-center transition-colors"
            >
              <span className="font-bold text-black">{item.Code} - {item.Name}</span>
              <span className="text-black font-bold text-sm bg-blue-200 px-3 py-1 rounded">Pilih +</span>
            </button>
          ))}
        </div>
      </div>

      {/* Tabel Keranjang Belanja */}
      <div className="border border-gray-400 rounded-lg overflow-hidden">
        <table className="w-full text-base text-left">
          <thead className="bg-gray-200 text-black border-b border-gray-400">
            <tr>
              <th className="p-3 font-bold">Kode</th>
              <th className="p-3 font-bold">Nama Barang</th>
              <th className="p-3 font-bold text-center">Qty</th>
              <th className="p-3 font-bold text-center">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-300 text-black font-medium">
            {items.length === 0 ? (
              <tr>
                <td colSpan={4} className="p-4 text-center text-black font-medium">Belum ada barang yang dipilih.</td>
              </tr>
            ) : (
              items.map((item, idx) => (
                <tr key={idx} className="hover:bg-gray-100">
                  <td className="p-3">{item.code}</td>
                  <td className="p-3">{item.name}</td>
                  <td className="p-3 text-center">{item.quantity}</td>
                  <td className="p-3 text-center">
                    <button onClick={() => removeItem(idx)} className="text-red-600 hover:text-red-800 font-bold">Hapus</button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Tombol Navigasi */}
      <div className="flex justify-between pt-4 border-t border-gray-300 mt-6">
        <button onClick={() => setStep(1)} className="text-black hover:underline font-bold">← Kembali (Edit Klien)</button>
        <button 
          onClick={() => setStep(3)} 
          disabled={items.length === 0} 
          className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-800 disabled:bg-gray-400 disabled:cursor-not-allowed font-bold"
        >
          Selanjutnya (Review) →
        </button>
      </div>
    </div>
  );
}