import { create } from 'zustand';
import { persist } from 'zustand/middleware';

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

export const useInvoiceStore = create<InvoiceState>()(
  persist(
    (set) => ({
      step: 1,
      senderName: '',
      senderAddress: '',
      receiverName: '',
      receiverAddress: '',
      items: [],
      setStep: (step) => set({ step }),
      setClientData: (data) => set((state) => ({ ...state, ...data })),
      
      // merge same item
      addItem: (newItem) => set((state) => {
        const existingItemIndex = state.items.findIndex(i => i.itemId === newItem.itemId);
        
        if (existingItemIndex !== -1) {
          // increase qty
          const updatedItems = [...state.items];
          updatedItems[existingItemIndex].quantity += newItem.quantity;
          return { items: updatedItems };
        }
        
        // add new row
        return { items: [...state.items, newItem] };
      }),

      removeItem: (index) => set((state) => ({
        items: state.items.filter((_, i) => i !== index),
      })),
      
      clearForm: () => set({
        step: 1, senderName: '', senderAddress: '', receiverName: '', receiverAddress: '', items: []
      }),
    }),
    { name: 'fleetify-invoice-storage' }
  )
);