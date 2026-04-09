import { useInvoiceStore } from '@/store/useInvoiceStore';

export default function InvoiceWizard() {
  const { currentStep } = useInvoiceStore();

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto bg-white p-6 rounded shadow">
        <h1 className="text-2xl font-bold mb-4">Buat Invoice - Step {currentStep}</h1>
        
        {currentStep === 1 && <p>Tampilan Form Data Klien (Step 1)</p>}
        {currentStep === 2 && <p>Tampilan Tabel Data Barang (Step 2)</p>}
        {currentStep === 3 && <p>Tampilan Review & Cetak (Step 3)</p>}

      </div>
    </div>
  );
}