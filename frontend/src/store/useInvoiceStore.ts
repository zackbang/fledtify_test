import { create } from 'zustand';

interface Item {
  itemId: number;
  code: string;
  name: string;
  quantity: number;
  price: number;
}

interface InvoiceState {
  step: number;
  senderName: string;
  senderAddress: string;
  receiverName: string;
  receiverAddress: string;
  items: Item[];
  setStep: (step: number) => void;
  setClientData: (data: Partial<InvoiceState>) => void;
  addItem: (item: Item) => void;
  removeItem: (index: number) => void;
  clearForm: () => void;
}

export const useInvoiceStore = create<InvoiceState>((set) => ({
  step: 1,
  senderName: '',
  senderAddress: '',
  receiverName: '',
  receiverAddress: '',
  items: [],
  setStep: (step) => set({ step }),
  setClientData: (data) => set((state) => ({ ...state, ...data })),
  addItem: (item) => set((state) => ({ items: [...state.items, item] })),
  removeItem: (index) => set((state) => ({
    items: state.items.filter((_, i) => i !== index),
  })),
  clearForm: () => set({
    step: 1,
    senderName: '',
    senderAddress: '',
    receiverName: '',
    receiverAddress: '',
    items: [],
  }),
}));