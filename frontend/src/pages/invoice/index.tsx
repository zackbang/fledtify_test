import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { useInvoiceStore } from "@/store/useInvoiceStore";
import Step1Client from "@/components/Step1Client";
import Step2Items from "@/components/Step2Items";
import Step3Review from "@/components/Step3Review";
import Cookies from "js-cookie";

export default function InvoicePage() {
  const router = useRouter();
  const { step, clearForm } = useInvoiceStore();
  const [user, setUser] = useState<{ username: string; role: string } | null>(null);

  useEffect(() => {
    const token = Cookies.get("token");
    if (!token) {
      router.push("/"); // Tendang ke login jika tidak ada token
      return;
    }

    try {
      // Decode JWT untuk ambil Role dan Username
      const payloadBase64 = token.split(".")[1];
      const decoded = JSON.parse(atob(payloadBase64));
      setUser({ username: decoded.username || "User", role: decoded.role });
    } catch (err) {
      console.error("Auth error:", err); // Tambahkan ini agar tidak error linting
      router.push("/");
    }
  }, [router]);

  const handleLogout = () => {
    Cookies.remove("token"); // Hapus KTP (Token)
    clearForm(); // Bersihkan memori Zustand
    router.push("/"); // Kembali ke halaman Login
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* NAVBAR / HEADER */}
      <nav className="bg-white border-b border-gray-200 px-6 py-3 flex justify-between items-center shadow-sm print:hidden">
        <div className="flex items-center gap-4">
          <h1 className="text-xl font-black text-blue-600 tracking-tighter">FLEETIFY APP</h1>
          <div className="h-6 w-[1px] bg-gray-300"></div>
          <p className="text-sm text-black font-medium">
            Logged in as: <span className="font-bold text-blue-700">{user.username}</span> 
            <span className="ml-2 px-2 py-0.5 bg-gray-200 rounded text-[10px] uppercase font-black">
              {user.role}
            </span>
          </p>
        </div>
        <button 
          onClick={handleLogout}
          className="text-sm font-bold text-red-600 hover:text-red-800 transition-colors"
        >
          Logout  →
        </button>
      </nav>

      <div className="max-w-4xl mx-auto py-10 px-4">
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-8">
          <h2 className="text-2xl font-black text-black mb-6">Pembuatan Invoice</h2>
          
          {/* Progress Tracker */}
          <div className="flex gap-4 mb-8 text-sm font-bold border-b border-gray-100 pb-4 print:hidden">
            <span className={`${step === 1 ? "text-blue-600" : "text-gray-400"}`}>1. Data Klien</span>
            <span className="text-gray-300">&gt;</span>
            <span className={`${step === 2 ? "text-blue-600" : "text-gray-400"}`}>2. Pilih Barang</span>
            <span className="text-gray-300">&gt;</span>
            <span className={`${step === 3 ? "text-blue-600" : "text-gray-400"}`}>3. Review & Cetak</span>
          </div>

          {/* Step Content */}
          {step === 1 && <Step1Client />}
          {step === 2 && <Step2Items />}
          {step === 3 && <Step3Review />}
        </div>
      </div>
    </div>
  );
}