import { useInvoiceStore } from '@/store/useInvoiceStore';

export default function Step1Client() {
  const { clientData, setClientData, setStep } = useInvoiceStore();

  const handleNext = (e: React.FormEvent) => {
    e.preventDefault();
    setStep(2);
  };

  return (
    <form onSubmit={handleNext} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Kolom Pengirim */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-gray-700 border-b pb-2">Data Pengirim</h2>
          <div>
            <label className="block text-sm font-medium text-gray-700">Nama Pengirim</label>
            <input
              type="text"
              required
              value={clientData.senderName}
              onChange={(e) => setClientData({ senderName: e.target.value })}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm border p-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Alamat Pengirim</label>
            <textarea
              required
              rows={3}
              value={clientData.senderAddress}
              onChange={(e) => setClientData({ senderAddress: e.target.value })}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm border p-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>

        {/* Kolom Penerima */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-gray-700 border-b pb-2">Data Penerima</h2>
          <div>
            <label className="block text-sm font-medium text-gray-700">Nama Penerima</label>
            <input
              type="text"
              required
              value={clientData.receiverName}
              onChange={(e) => setClientData({ receiverName: e.target.value })}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm border p-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Alamat Penerima</label>
            <textarea
              required
              rows={3}
              value={clientData.receiverAddress}
              onChange={(e) => setClientData({ receiverAddress: e.target.value })}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm border p-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>
      </div>

      <div className="flex justify-end pt-4">
        <button
          type="submit"
          className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 focus:outline-none"
        >
          Selanjutnya (Pilih Barang)
        </button>
      </div>
    </form>
  );
}