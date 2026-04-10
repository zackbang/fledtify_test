import { useInvoiceStore } from '@/store/useInvoiceStore';
import { useState } from 'react';
import axios from 'axios';

export default function Step3Review() {
  const state = useInvoiceStore();
  const [loading, setLoading] = useState(false);

  // Hitung perkiraan total di Frontend (Backend tetap akan menghitung ulang)
  const estimatedTotal = state.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const payload = {
        sender_name: state.senderName,
        sender_address: state.senderAddress,
        receiver_name: state.receiverName,
        receiver_address: state.receiverAddress,
        items: state.items.map(item => ({ item_id: item.itemId, quantity: item.quantity }))
      };

      const res = await axios.post('http://localhost:8080/api/invoices', payload);
      
      alert(`Sukses! ${res.data.message}\nNomor Invoice: ${res.data.invoice_no}`);
      
      // Bersihkan form & kembali ke awal
      state.clearForm();
      state.setStep(1);
    } catch (error) {
     console.error(error);
     alert("Gagal membuat invoice. Coba lagi.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-gray-100 p-4 rounded-lg border border-gray-300">
        <h3 className="font-bold text-black text-lg mb-4 border-b border-gray-300 pb-2">Ringkasan Data Klien</h3>
        <div className="grid grid-cols-2 gap-4 text-black">
          <div>
            <p className="text-sm font-bold text-gray-700">Pengirim:</p>
            <p className="font-medium">{state.senderName}</p>
            <p className="text-sm">{state.senderAddress}</p>
          </div>
          <div>
            <p className="text-sm font-bold text-gray-700">Penerima:</p>
            <p className="font-medium">{state.receiverName}</p>
            <p className="text-sm">{state.receiverAddress}</p>
          </div>
        </div>
      </div>

      <div className="border border-gray-400 rounded-lg overflow-hidden">
        <table className="w-full text-base text-left">
          <thead className="bg-gray-200 text-black border-b border-gray-400">
            <tr>
              <th className="p-3 font-bold">Barang</th>
              <th className="p-3 font-bold text-center">Qty</th>
              <th className="p-3 font-bold text-right">Harga Satuan</th>
              <th className="p-3 font-bold text-right">Subtotal</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-300 text-black font-medium">
            {state.items.map((item, idx) => (
              <tr key={idx} className="hover:bg-gray-50">
                <td className="p-3">{item.code} - {item.name}</td>
                <td className="p-3 text-center">{item.quantity}</td>
                <td className="p-3 text-right">Rp {item.price.toLocaleString('id-ID')}</td>
                <td className="p-3 text-right">Rp {(item.price * item.quantity).toLocaleString('id-ID')}</td>
              </tr>
            ))}
          </tbody>
          <tfoot className="bg-blue-50 border-t-2 border-gray-400 text-black font-bold">
            <tr>
              <td colSpan={3} className="p-3 text-right">Total Perkiraan:</td>
              <td className="p-3 text-right">Rp {estimatedTotal.toLocaleString('id-ID')}</td>
            </tr>
          </tfoot>
        </table>
      </div>

      <div className="flex justify-between pt-4 border-t border-gray-300 mt-6">
        <button onClick={() => state.setStep(2)} className="text-black hover:underline font-bold">← Kembali (Edit Barang)</button>
        <button 
          onClick={handleSubmit} 
          disabled={loading}
          className="bg-green-600 text-white px-8 py-3 rounded-md hover:bg-green-800 disabled:bg-gray-400 font-bold text-lg shadow-md"
        >
          {loading ? 'Menyimpan...' : '💾 SIMPAN INVOICE'}
        </button>
      </div>
    </div>
  );
}