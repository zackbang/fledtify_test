import { useEffect, useState } from 'react';
import { useInvoiceStore } from '@/store/useInvoiceStore';
import Step1Client from '@/components/Step1Client';
import Step2Items from '@/components/Step2Items';

export default function InvoiceWizard() {
  
  const [isMounted, setIsMounted] = useState(false);
  const { currentStep } = useInvoiceStore();

  
  useEffect(() => {
    setIsMounted(true);
  }, []);

 
  if (!isMounted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <p className="text-gray-500 animate-pulse">Memuat data...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto bg-white p-8 rounded-xl shadow-lg">
        
        {/* Header Progress */}
        <div className="mb-8 border-b pb-4">
          <h1 className="text-2xl font-bold text-gray-800">Pembuatan Invoice</h1>
          <div className="flex space-x-4 mt-4 text-sm font-medium">
            <span className={currentStep >= 1 ? 'text-blue-600' : 'text-gray-400'}>1. Data Klien</span>
            <span className="text-gray-300">{'>'}</span>
            <span className={currentStep >= 2 ? 'text-blue-600' : 'text-gray-400'}>2. Pilih Barang</span>
            <span className="text-gray-300">{'>'}</span>
            <span className={currentStep === 3 ? 'text-blue-600' : 'text-gray-400'}>3. Review & Cetak</span>
          </div>
        </div>

        {/* Render Step secara Dinamis */}
        {currentStep === 1 && <Step1Client />}
        {currentStep === 2 && <Step2Items />}
        {currentStep === 3 && <p className="text-center py-10">UI Step 3 sedang dibangun...</p>}

      </div>
    </div>
  );
}