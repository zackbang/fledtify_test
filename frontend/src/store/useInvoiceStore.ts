import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface ClientData {
  senderName: string;
  senderAddress: string;
  receiverName: string;
  receiverAddress: string;
}

interface InvoiceItem {
  itemId: string | number;
  code: string;
  name: string;
  quantity: number;
  price?: number; 
}

interface InvoiceState {
  currentStep: number;
  clientData: ClientData;
  items: InvoiceItem[];
  setStep: (step: number) => void;
  setClientData: (data: Partial<ClientData>) => void;
  addItem: (item: InvoiceItem) => void;
  removeItem: (index: number) => void;
  resetForm: () => void;
}

const initialClientData: ClientData = {
  senderName: '',
  senderAddress: '',
  receiverName: '',
  receiverAddress: '',
};

export const useInvoiceStore = create<InvoiceState>()(
  persist(
    (set) => ({
      currentStep: 1,
      clientData: initialClientData,
      items: [],
      setStep: (step) => set({ currentStep: step }),
      setClientData: (data) =>
        set((state) => ({
          clientData: { ...state.clientData, ...data },
        })),
      addItem: (item) =>
        set((state) => ({ items: [...state.items, item] })),
      removeItem: (index) =>
        set((state) => ({
          items: state.items.filter((_, i) => i !== index),
        })),
      resetForm: () =>
        set({ currentStep: 1, clientData: initialClientData, items: [] }),
    }),
    {
      name: 'invoice-storage', 
    }
  )
);