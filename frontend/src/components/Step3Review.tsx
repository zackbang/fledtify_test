import { useInvoiceStore } from '@/store/useInvoiceStore';
import { useState, useEffect } from 'react';
import api from '@/lib/axios'; 
import Cookies from 'js-cookie';

interface InvoiceItemPayload {
  item_id: number;
  quantity: number;
  price?: number;
  subtotal?: number;
}

export default function Step3Review() {
  const state = useInvoiceStore();
  const [loading, setLoading] = useState(false);
  const [role, setRole] = useState('');

  useEffect(() => {
    const token = Cookies.get('token');
    if (token) {
      try {
        const parts = token.split('.');
        if (parts.length === 3) {
          const payloadBase64 = parts[1];
          const decoded = JSON.parse(atob(payloadBase64));
          setRole(decoded.role.toLowerCase());
        }
      } catch (e) {
        console.error("Gagal decode role", e);
      }
    }
  }, []);

  const estimatedTotal = state.items.reduce((sum, item) => sum + ((item.price || 0) * item.quantity), 0);

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const payload: {
        sender_name: string;
        sender_address: string;
        receiver_name: string;
        receiver_address: string;
        items: InvoiceItemPayload[];
      } = {
        sender_name: state.senderName,
        sender_address: state.senderAddress,
        receiver_name: state.receiverName,
        receiver_address: state.receiverAddress,
        items: []
      };

      if (role === 'kerani') {
        payload.items = state.items.map(item => ({
          item_id: item.itemId,
          quantity: item.quantity
        }));
      } else {
        payload.items = state.items.map(item => ({
          item_id: item.itemId,
          quantity: item.quantity,
          price: item.price,
          subtotal: (item.price || 0) * item.quantity
        }));
      }

      const res = await api.post('/invoices', payload); 
      
      alert(`Sukses! ${res.data.message}\nNomor Invoice: ${res.data.invoice_no}`);
      state.clearForm();
      state.setStep(1);
    } catch (error) {
      console.error("Error dari Backend:", error);
      let errorMessage = "Terjadi kesalahan yang tidak diketahui.";
      if (error && typeof error === 'object' && 'response' in error) {
        const errResp = (error as Record<string, unknown>).response as Record<string, unknown>;
        if (errResp && errResp.data && typeof errResp.data === 'object') {
            errorMessage = (errResp.data as Record<string, string>).error || errorMessage;
        }
      } else if (error instanceof Error) {
        errorMessage = error.message;
      }
      alert(`Gagal menyimpan invoice!\n\nAlasan: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Print CSS */}
      <style>{`
        @media print {
          @page { size: A4 portrait; margin: 10mm; }
          body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          #invoice-print { display: block !important; }
        }
      `}</style>

      {/* Screen UI */}
      <div className="print:hidden space-y-6">
        <div className="bg-gray-100 p-4 rounded-lg border border-gray-300 text-black">
          <h3 className="font-bold border-b-2 border-gray-300 pb-2 mb-4 uppercase text-sm">Informasi Pengiriman</h3>
          <div className="grid grid-cols-2 gap-6">
            <div>
              <p className="text-[10px] font-black text-gray-500 uppercase">Pengirim</p>
              <p className="font-bold text-lg uppercase">{state.senderName}</p>
              <p className="text-sm text-gray-700">{state.senderAddress}</p>
            </div>
            <div>
              <p className="text-[10px] font-black text-gray-500 uppercase">Penerima</p>
              <p className="font-bold text-lg uppercase">{state.receiverName}</p>
              <p className="text-sm text-gray-700">{state.receiverAddress}</p>
            </div>
          </div>
        </div>

        <div className="border-2 border-gray-300 rounded-xl overflow-hidden shadow-sm">
          <table className="w-full text-left">
            <thead className="bg-gray-800 text-white text-[11px] uppercase tracking-widest">
              <tr>
                <th className="p-4">Deskripsi Barang</th>
                <th className="p-4 text-center">Qty</th>
                {role !== 'kerani' && (
                  <>
                    <th className="p-4 text-right">Harga</th>
                    <th className="p-4 text-right">Subtotal</th>
                  </>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 text-black font-medium bg-white">
              {state.items.map((item, i) => (
                <tr key={i}>
                  <td className="p-4"><span className="font-black text-blue-600 mr-2"></span>{item.name}</td>
                  <td className="p-4 text-center font-bold">{item.quantity}</td>
                  {role !== 'kerani' && (
                    <>
                      <td className="p-4 text-right">Rp {(item.price || 0).toLocaleString('id-ID')}</td>
                      <td className="p-4 text-right font-black">Rp {((item.price || 0) * item.quantity).toLocaleString('id-ID')}</td>
                    </>
                  )}
                </tr>
              ))}
            </tbody>
            {role !== 'kerani' && (
              <tfoot className="bg-gray-50 border-t-2 border-gray-300">
                <tr>
                  <td colSpan={3} className="p-4 text-right font-black uppercase text-sm">Grand Total (Estimasi)</td>
                  <td className="p-4 text-right font-black text-xl text-blue-700">Rp {estimatedTotal.toLocaleString('id-ID')}</td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>

        <div className="flex justify-between items-center pt-6 border-t-2 border-gray-100">
          <button onClick={() => state.setStep(2)} className="text-gray-400 hover:text-black font-black uppercase text-xs tracking-widest transition-colors">
            ← Edit Barang
          </button>
          <div className="flex gap-3">
            <button onClick={() => window.print()} className="bg-gray-200 hover:bg-gray-300 text-black px-6 py-3 rounded-xl font-black uppercase text-xs tracking-widest transition-all">
              🖨️ Cetak A4
            </button>
            <button 
              onClick={handleSubmit} 
              disabled={loading} 
              className="bg-green-600 hover:bg-green-700 text-white px-10 py-3 rounded-xl font-black uppercase text-xs tracking-widest shadow-lg transform active:scale-95 transition-all"
            >
              {loading ? 'Processing...' : '💾 Simpan Invoice'}
            </button>
          </div>
        </div>
      </div>

      {/* Print layout */}
      <div id="invoice-print" className="hidden print:block text-black bg-white font-sans text-sm w-full">
        
        {/* Header */}
        <div className="flex justify-between items-center border-b-2 border-gray-800 pb-4 mb-6">
          <div>
            <h1 className="text-3xl font-black tracking-tighter text-gray-900">FLEETIFY LOGISTICS</h1>
            <p className="text-xs font-medium text-gray-600 mt-1">Jl. Telekomunikasi No. 1, Bandung, Jawa Barat</p>
            <p className="text-xs font-medium text-gray-600">Email: support@fleetify.co.id | Telp: (022) 123-4567</p>
          </div>
          <div className="text-right">
            <h2 className="text-4xl font-black text-gray-300 tracking-widest uppercase mb-1">INVOICE</h2>
            <p className="text-xs font-bold text-gray-800">Tanggal: {new Date().toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
            <p className="text-[10px] text-gray-500 uppercase">Resi Internal</p>
          </div>
        </div>

        {/* Client info */}
        <div className="flex gap-6 mb-6">
          <div className="w-1/2 bg-gray-50 p-4 rounded border border-gray-200">
            <p className="text-[10px] font-black uppercase text-blue-800 mb-1 tracking-widest">Pengirim (Dari):</p>
            <p className="text-base font-black uppercase text-gray-900">{state.senderName}</p>
            <p className="text-xs text-gray-700 leading-tight mt-1">{state.senderAddress}</p>
          </div>
          <div className="w-1/2 bg-gray-50 p-4 rounded border border-gray-200">
            <p className="text-[10px] font-black uppercase text-blue-800 mb-1 tracking-widest">Penerima (Kepada):</p>
            <p className="text-base font-black uppercase text-gray-900">{state.receiverName}</p>
            <p className="text-xs text-gray-700 leading-tight mt-1">{state.receiverAddress}</p>
          </div>
        </div>

        {/* Items table */}
        <table className="w-full text-left mb-6 border-collapse">
          <thead>
            <tr className="bg-gray-800 text-white text-[11px] uppercase tracking-wider">
              <th className="py-2 px-3 border border-gray-800">Kode</th>
              <th className="py-2 px-3 border border-gray-800">Deskripsi Barang</th>
              <th className="py-2 px-3 border border-gray-800 text-center w-16">Qty</th>
              <th className="py-2 px-3 border border-gray-800 text-right w-28">Harga</th>
              <th className="py-2 px-3 border border-gray-800 text-right w-32">Total</th>
            </tr>
          </thead>
          <tbody className="text-xs text-gray-800">
            {state.items.map((item, i) => (
              <tr key={i} className="border-b border-gray-300">
                <td className="py-2 px-3 border-x border-gray-300 font-bold">{item.code}</td>
                <td className="py-2 px-3 border-x border-gray-300">{item.name}</td>
                <td className="py-2 px-3 border-x border-gray-300 text-center font-bold">{item.quantity}</td>
                <td className="py-2 px-3 border-x border-gray-300 text-right">Rp {(item.price || 0).toLocaleString('id-ID')}</td>
                <td className="py-2 px-3 border-x border-gray-300 text-right font-black">Rp {((item.price || 0) * item.quantity).toLocaleString('id-ID')}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr>
              <td colSpan={4} className="py-3 px-4 text-right font-black uppercase text-[11px] border-t-2 border-gray-800">Total Tagihan (IDR)</td>
              <td className="py-3 px-4 text-right font-black text-lg border-t-2 border-gray-800 text-gray-900 bg-gray-100">
                Rp {estimatedTotal.toLocaleString('id-ID')}
              </td>
            </tr>
          </tfoot>
        </table>

        {/* Signatures */}
        <div className="flex justify-between items-end mt-12 text-center text-xs break-inside-avoid px-8">
          <div className="w-48">
            <p className="mb-12 text-gray-600 font-medium">Pihak Pengirim,</p>
            <p className="font-black uppercase border-b border-gray-400 inline-block px-4 pb-1">{state.senderName}</p>
          </div>
          <div className="w-48">
            <p className="mb-12 text-gray-600 font-medium">Pihak Penerima,</p>
            <p className="font-black uppercase border-b border-gray-400 inline-block px-4 pb-1">{state.receiverName}</p>
          </div>
          <div className="w-48">
            <p className="mb-12 text-gray-600 font-medium">Authorized Officer,</p>
            <p className="font-black uppercase border-b border-gray-400 inline-block px-4 pb-1">Petugas Logistik</p>
          </div>
        </div>

        {/* Footer note */}
        <div className="mt-8 text-center text-[10px] text-gray-400 border-t border-gray-200 pt-3 break-inside-avoid">
          <p>Dokumen ini sah dan dicetak secara otomatis oleh Sistem Logistik Fleetify.</p>
        </div>

      </div>
    </div>
  );
}