import { useInvoiceStore } from '@/store/useInvoiceStore';

export default function Step1Client() {
  const state = useInvoiceStore();

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-6">
        {/* Pengirim */}
        <div className="space-y-4">
          <h3 className="font-bold text-black border-b border-gray-300 pb-2">Data Pengirim</h3>
          <div>
            <label className="block text-sm font-bold text-black">Nama Pengirim</label>
            <input
              type="text"
              value={state.senderName}
              onChange={(e) => state.setClientData({ senderName: e.target.value })}
              className="mt-1 block w-full rounded-md border-gray-400 border p-2 text-black font-medium focus:border-blue-600 focus:ring-blue-600"
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-black">Alamat Pengirim</label>
            <textarea
              value={state.senderAddress}
              onChange={(e) => state.setClientData({ senderAddress: e.target.value })}
              className="mt-1 block w-full rounded-md border-gray-400 border p-2 text-black font-medium focus:border-blue-600 focus:ring-blue-600"
              rows={3}
            />
          </div>
        </div>

        {/* Penerima */}
        <div className="space-y-4">
          <h3 className="font-bold text-black border-b border-gray-300 pb-2">Data Penerima</h3>
          <div>
            <label className="block text-sm font-bold text-black">Nama Penerima</label>
            <input
              type="text"
              value={state.receiverName}
              onChange={(e) => state.setClientData({ receiverName: e.target.value })}
              className="mt-1 block w-full rounded-md border-gray-400 border p-2 text-black font-medium focus:border-blue-600 focus:ring-blue-600"
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-black">Alamat Penerima</label>
            <textarea
              value={state.receiverAddress}
              onChange={(e) => state.setClientData({ receiverAddress: e.target.value })}
              className="mt-1 block w-full rounded-md border-gray-400 border p-2 text-black font-medium focus:border-blue-600 focus:ring-blue-600"
              rows={3}
            />
          </div>
        </div>
      </div>

      <div className="flex justify-end pt-4 mt-6 border-t border-gray-300">
        <button
          onClick={() => state.setStep(2)}
          disabled={!state.senderName || !state.receiverName}
          className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-800 font-bold disabled:bg-gray-400"
        >
          Selanjutnya  →
        </button>
      </div>
    </div>
  );
}