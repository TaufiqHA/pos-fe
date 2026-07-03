import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Product, Sale, StockHistory, User, Customer, Supplier, Purchase, Delivery, Branch } from '../types';
import api from '../lib/axios';

type PosState = {
  user: User | null;
  users: User[];
  branches: Branch[];
  products: Product[];
  sales: Sale[];
  purchases: Purchase[];
  stockHistory: StockHistory[];
  customers: Customer[];
  suppliers: Supplier[];
  deliveries: Delivery[];
  promoBannerUrls: string[];
  categories: string[];
  units: string[];
  wilayahs: string[];

  login: (user: User) => void;
  logout: () => void;
  fetchAllData: () => Promise<void>;

  addCategory: (cat: string) => Promise<void>;
  editCategory: (oldCat: string, newCat: string) => Promise<void>;
  deleteCategory: (cat: string) => Promise<void>;

  addUnit: (unit: string) => Promise<void>;
  editUnit: (oldUnit: string, newUnit: string) => Promise<void>;
  deleteUnit: (unit: string) => Promise<void>;

  addWilayah: (wilayah: string) => Promise<void>;
  editWilayah: (oldWilayah: string, newWilayah: string) => Promise<void>;
  deleteWilayah: (wilayah: string) => Promise<void>;

  addUser: (user: Omit<User, 'id'>) => Promise<void>;
  updateUser: (id: string, updates: Partial<User>) => Promise<void>;
  deleteUser: (id: string) => Promise<void>;

  addBranch: (branch: Omit<Branch, 'id'>) => Promise<any>;
  updateBranch: (id: string, updates: Partial<Branch>) => Promise<void>;
  deleteBranch: (id: string) => Promise<void>;

  addProduct: (product: Omit<Product, 'id'>) => Promise<void>;
  updateProduct: (id: string, product: Partial<Product>) => Promise<void>;
  deleteProduct: (id: string) => Promise<void>;

  addCustomer: (customer: Omit<Customer, 'id'>) => Promise<void>;
  updateCustomer: (id: string, customer: Partial<Customer>) => Promise<void>;
  deleteCustomer: (id: string) => Promise<void>;

  addSupplier: (supplier: Omit<Supplier, 'id'>) => Promise<void>;
  updateSupplier: (id: string, supplier: Partial<Supplier>) => Promise<void>;
  deleteSupplier: (id: string) => Promise<void>;

  addSale: (sale: Omit<Sale, 'id' | 'invoice'>) => Promise<string>;
  paySale: (id: string, amount: number) => Promise<void>;
  updateSale: (id: string, updates: Partial<Sale>) => Promise<void>;
  deleteSale: (id: string) => Promise<void>;

  addPurchase: (purchase: Omit<Purchase, 'id' | 'invoice'>) => Promise<string>;
  payPurchase: (id: string, amount: number, isPending?: boolean) => Promise<void>;
  processPurchase: (id: string) => Promise<void>;
  cancelPurchase: (id: string) => Promise<void>;

  updatePurchase: (id: string, updates: Partial<Purchase>) => Promise<void>;
  deletePurchase: (id: string) => Promise<void>;
  addDelivery: (delivery: Omit<Delivery, 'id'>) => Promise<string>;
  updateDelivery: (id: string, updates: Partial<Delivery>) => Promise<void>;

  adjustStock: (productId: string, type: 'Tambah' | 'Kurang', qty: number, reason: string) => Promise<void>;
  setPromoBanners: (urls: string[]) => void;

  selectedInvoiceModal: string | null;
  openInvoiceModal: (invoice: string) => void;
  closeInvoiceModal: () => void;
};

export const usePosStore = create<PosState>()(
  persist(
    (set, get) => ({
      user: null,
      users: [],
      branches: [],
      products: [],
      sales: [],
      purchases: [],
      stockHistory: [],
      customers: [],
      suppliers: [],
      deliveries: [],
      promoBannerUrls: [],
      categories: [],
      units: [],
      wilayahs: [],

      selectedInvoiceModal: null,
      openInvoiceModal: (invoice: string) => set({ selectedInvoiceModal: invoice }),
      closeInvoiceModal: () => set({ selectedInvoiceModal: null }),

      login: (user) => set({ user }),
      logout: () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        set({ user: null });
      },

       fetchAllData: async () => {
        try {
          const user = get().user;
          const salesUrl = '/sales';
          const [
            resUsers, resProducts, resSales, resPurchases, resCategories, resUnits, resCustomers, resSuppliers, resDeliveries, resStockHistory, resBranches, resSettings, resWilayahs
          ] = await Promise.all([
            api.get('/users'),
            api.get('/products'),
            api.get(salesUrl),
            api.get('/purchases'),
            api.get('/categories'),
            api.get('/units'),
            api.get('/customers'),
            api.get('/suppliers'),
            api.get('/deliveries'),
            api.get('/stock-history'),
            api.get('/branches'),
            api.get('/settings'),
            api.get('/wilayahs')
          ]);

          const rawSales = Array.isArray(resSales.data) ? resSales.data : [];
          const rawPurchases = Array.isArray(resPurchases.data) ? resPurchases.data : [];

          const purchasesMap = new Map(rawPurchases.map((p: any) => [p.id, p]));

          // Sinkronisasi otomatis dua arah antara Penjualan (Sale) dan Pembelian (Purchase) yang terhubung
          const syncedSales = rawSales.map((s: any) => {
            if (s.paymentRef) {
              const linkedP = purchasesMap.get(s.paymentRef) || rawPurchases.find((p: any) => p.invoice === s.invoice);
              if (linkedP && linkedP.status === 'Lunas' && s.status !== 'Lunas') {
                return { ...s, status: 'Lunas', cashGiven: s.grandTotal };
              }
            }
            return s;
          });

          const syncedPurchases = rawPurchases.map((p: any) => {
            const linkedS = rawSales.find((s: any) => s.paymentRef === p.id);
            
            if (linkedS) {
              let updates: any = {};
              let needsUpdate = false;

              // 1. Sinkronisasi status Lunas
              if (linkedS.status === 'Lunas' && p.status !== 'Lunas') {
                updates.status = 'Lunas';
                updates.cashGiven = p.total;
                needsUpdate = true;
              }

              // 2. Sinkronisasi metode pembayaran
              if (p.method !== linkedS.method) {
                updates.method = linkedS.method;
                needsUpdate = true;
              }

              // 3. Update ke backend dan state lokal jika ada perubahan
              if (needsUpdate) {
                api.put(`/purchases/${p.id}`, updates).catch(() => {});
                return { ...p, ...updates };
              }
            }
            
            return p;
          });

          set({
            users: Array.isArray(resUsers.data) ? resUsers.data : [],
            products: Array.isArray(resProducts.data) ? resProducts.data : [],
            sales: syncedSales,
            purchases: syncedPurchases,
            categories: Array.isArray(resCategories.data) ? resCategories.data.map((c: any) => c.name) : [],
            units: Array.isArray(resUnits.data) ? resUnits.data.map((u: any) => u.name) : [],
            customers: Array.isArray(resCustomers.data) ? resCustomers.data : [],
            suppliers: Array.isArray(resSuppliers.data) ? resSuppliers.data : [],
            deliveries: Array.isArray(resDeliveries.data) ? resDeliveries.data : [],
            stockHistory: Array.isArray(resStockHistory.data) ? resStockHistory.data : [],
            branches: Array.isArray(resBranches.data) ? resBranches.data : [],
            promoBannerUrls: Array.isArray(resSettings.data?.promoBannerUrls) ? resSettings.data.promoBannerUrls : [],
            wilayahs: Array.isArray(resWilayahs.data) ? resWilayahs.data.map((w: any) => w.name) : []
          });
        } catch (error) {
          console.error("Gagal mengambil data master dari API", error);
        }
      },

      addCategory: async (cat) => {
        await api.post('/categories', { name: cat });
        const res = await api.get('/categories');
        set({ categories: Array.isArray(res.data) ? res.data.map((c: any) => c.name) : [] });
      },
      editCategory: async (oldCat, newCat) => {
        // Backend doesn't have PUT /categories by name out-of-the-box in standard CRUD if it's based on ID
        // Assuming a standard way or just ignoring for now and reloading
        try {
            await api.put(`/categories/${oldCat}`, { name: newCat });
        } catch(e) {}
        const res = await api.get('/categories');
        set({ categories: Array.isArray(res.data) ? res.data.map((c: any) => c.name) : [] });
      },
      deleteCategory: async (cat) => {
        try {
            await api.delete(`/categories/${cat}`);
        } catch(e) {}
        const res = await api.get('/categories');
        set({ categories: Array.isArray(res.data) ? res.data.map((c: any) => c.name) : [] });
      },

      addUnit: async (unit) => {
        await api.post('/units', { name: unit });
        const res = await api.get('/units');
        set({ units: Array.isArray(res.data) ? res.data.map((u: any) => u.name) : [] });
      },
      editUnit: async (oldUnit, newUnit) => {
        try {
            await api.put(`/units/${oldUnit}`, { name: newUnit });
        } catch(e) {}
        const res = await api.get('/units');
        set({ units: Array.isArray(res.data) ? res.data.map((u: any) => u.name) : [] });
      },
      deleteUnit: async (unit) => {
        try {
            await api.delete(`/units/${unit}`);
        } catch(e) {}
        const res = await api.get('/units');
        set({ units: Array.isArray(res.data) ? res.data.map((u: any) => u.name) : [] });
      },

      addWilayah: async (wilayah) => {
        await api.post('/wilayahs', { name: wilayah });
        const res = await api.get('/wilayahs');
        set({ wilayahs: Array.isArray(res.data) ? res.data.map((w: any) => w.name) : [] });
      },
      editWilayah: async (oldWilayah, newWilayah) => {
        try {
            await api.put(`/wilayahs/${oldWilayah}`, { name: newWilayah });
        } catch(e) {}
        const res = await api.get('/wilayahs');
        set({ wilayahs: Array.isArray(res.data) ? res.data.map((w: any) => w.name) : [] });
      },
      deleteWilayah: async (wilayah) => {
        try {
            await api.delete(`/wilayahs/${wilayah}`);
        } catch(e) {}
        const res = await api.get('/wilayahs');
        set({ wilayahs: Array.isArray(res.data) ? res.data.map((w: any) => w.name) : [] });
      },

      addUser: async (user) => {
        const res = await api.post('/users', user);
        set((state) => ({ users: [...state.users, res.data] }));
      },
      updateUser: async (id, updates) => {
        const res = await api.put(`/users/${id}`, updates);
        set((state) => ({ users: state.users.map(u => u.id === id ? res.data : u) }));
      },
      deleteUser: async (id) => {
        await api.delete(`/users/${id}`);
        set((state) => ({ users: state.users.filter(u => u.id !== id) }));
      },

      addBranch: async (branch) => {
        const res = await api.post('/branches', branch);
        set((state) => ({ branches: [...state.branches, res.data] }));
        return res.data;
      },
      updateBranch: async (id, updates) => {
        const res = await api.put(`/branches/${id}`, updates);
        set((state) => ({ branches: state.branches.map(b => b.id === id ? res.data : b) }));
      },
      deleteBranch: async (id) => {
        await api.delete(`/branches/${id}`);
        set((state) => ({ branches: state.branches.filter(b => b.id !== id) }));
      },

      addProduct: async (product) => {
        const res = await api.post('/products', product);
        set((state) => ({ products: [...state.products, res.data] }));
        get().fetchAllData(); // refresh for stock history
      },
      updateProduct: async (id, updates) => {
        const res = await api.put(`/products/${id}`, updates);
        set((state) => ({ products: state.products.map(p => p.id === id ? res.data : p) }));
      },
      deleteProduct: async (id) => {
        await api.delete(`/products/${id}`);
        set((state) => ({ products: state.products.filter(p => p.id !== id) }));
      },

      addCustomer: async (cust) => {
        const res = await api.post('/customers', cust);
        set((state) => ({ customers: [...state.customers, res.data] }));
      },
      updateCustomer: async (id, updates) => {
        const res = await api.put(`/customers/${id}`, updates);
        set((state) => ({ customers: state.customers.map(c => c.id === id ? res.data : c) }));
      },
      deleteCustomer: async (id) => {
        await api.delete(`/customers/${id}`);
        set((state) => ({ customers: state.customers.filter(c => c.id !== id) }));
      },

      addSupplier: async (sup) => {
        const res = await api.post('/suppliers', sup);
        set((state) => ({ suppliers: [...state.suppliers, res.data] }));
      },
      updateSupplier: async (id, updates) => {
        const res = await api.put(`/suppliers/${id}`, updates);
        set((state) => ({ suppliers: state.suppliers.map(s => s.id === id ? res.data : s) }));
      },
      deleteSupplier: async (id) => {
        await api.delete(`/suppliers/${id}`);
        set((state) => ({ suppliers: state.suppliers.filter(s => s.id !== id) }));
      },

      addSale: async (sale) => {
        const res = await api.post('/sales', sale);
        if (res.data && res.data.id) {
          set((state) => ({ sales: [res.data, ...state.sales.filter(s => s.id !== res.data.id)] }));
        }
        await get().fetchAllData(); 
        return res.data.id;
      },
      paySale: async (id, amount) => {
        await api.post(`/sales/${id}/pay`, { amount });
        await get().fetchAllData();
      },
      updateSale: async (id, updates) => {
        await api.put(`/sales/${id}`, updates);
        await get().fetchAllData();
      },
      deleteSale: async (id) => {
        await api.delete(`/sales/${id}`);
        await get().fetchAllData();
      },

      addPurchase: async (purchase) => {
        const res = await api.post('/purchases', purchase);
        if (res.data && res.data.id) {
          set((state) => ({ purchases: [res.data, ...state.purchases.filter(p => p.id !== res.data.id)] }));
        }
        await get().fetchAllData();
        return res.data.id;
      },
      payPurchase: async (id, amount, isPending = false) => {
        await api.post(`/purchases/${id}/pay`, { amount, isPending });
        await get().fetchAllData();
      },
      processPurchase: async (id) => {
        await api.post(`/purchases/${id}/process`);
        await get().fetchAllData();
      },
      cancelPurchase: async (id) => {
        await api.post(`/purchases/${id}/cancel`);
        await get().fetchAllData();
      },

      updatePurchase: async (id, updates) => {
        await api.put(`/purchases/${id}`, updates);
        await get().fetchAllData();
      },
      deletePurchase: async (id) => {
        await api.delete(`/purchases/${id}`);
        await get().fetchAllData();
      },

      addDelivery: async (delivery) => {
        const res = await api.post('/deliveries', delivery);
        await get().fetchAllData();
        return res.data?.id || '';
      },

      updateDelivery: async (id, updates) => {
        await api.put(`/deliveries/${id}`, updates);
        await get().fetchAllData();
      },

      adjustStock: async (productId, type, qty, reason) => {
        await api.post('/products/adjust-stock', { productId, type, qty, reason });
        await get().fetchAllData();
      },
      
      setPromoBanners: async (urls) => {
        try {
          await api.put('/settings/promoBannerUrls', { value: urls });
          set({ promoBannerUrls: urls });
        } catch (error) {
          console.error("Gagal menyimpan banner promosi", error);
        }
      }
    }),
    {
      name: 'pos-storage-v4', // Change to v4 to clear old localstorage caches
      merge: (persistedState: any, currentState: PosState) => {
        const state = persistedState || {};
        return {
          ...currentState,
          ...state,
          users: Array.isArray(state.users) ? state.users : currentState.users,
          branches: Array.isArray(state.branches) ? state.branches : currentState.branches,
          products: Array.isArray(state.products) ? state.products : currentState.products,
          sales: Array.isArray(state.sales) ? state.sales : currentState.sales,
          purchases: Array.isArray(state.purchases) ? state.purchases : currentState.purchases,
          stockHistory: Array.isArray(state.stockHistory) ? state.stockHistory : currentState.stockHistory,
          customers: Array.isArray(state.customers) ? state.customers : currentState.customers,
          suppliers: Array.isArray(state.suppliers) ? state.suppliers : currentState.suppliers,
          deliveries: Array.isArray(state.deliveries) ? state.deliveries : currentState.deliveries,
          promoBannerUrls: Array.isArray(state.promoBannerUrls) ? state.promoBannerUrls : currentState.promoBannerUrls,
          categories: Array.isArray(state.categories) ? state.categories : currentState.categories,
          units: Array.isArray(state.units) ? state.units : currentState.units,
          wilayahs: Array.isArray(state.wilayahs) ? state.wilayahs : currentState.wilayahs,
          selectedInvoiceModal: null,
        };
      },
    }
  )
);
