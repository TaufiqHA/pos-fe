export type Branch = {
  id: string;
  name: string;
  address: string;
  phone: string;
  wilayah?: string;
  notes?: string;
};

export type User = {
  id: string;
  name: string;
  email: string;
  role: 'Admin' | 'Cabang' | 'Sales' | 'Kurir' | 'Cust' | 'Outlet';
  branchId?: string;
  status?: 'Aktif' | 'Nonaktif';
  password?: string;
  outletName?: string;
  parentId?: string;
};

export type Customer = {
  id: string;
  name: string;
  phone: string;
  address: string;
  notes: string;
  wilayah?: string;
  cabang?: string;
  branchId?: string;
};

export type Supplier = {
  id: string;
  name: string;
  contactName: string;
  phone: string;
  address: string;
};

export type Product = {
  id: string;
  sku: string;
  name: string;
  category: string;
  buyPrice: number;
  sellPrice: number;
  averageCost?: number; // Nilai HPP saat ini (Moving Average)
  stock: number;
  centralStock?: number; // Stok nyata di Admin Pusat
  minStock: number;
  unit: string;
  image?: string;
  isWholesale?: boolean;
  wholesalePrices?: { qty: number; price: number }[];
  branchPrices?: Record<string, number>;
  branchIsWholesale?: Record<string, boolean>;
  branchWholesalePrices?: Record<string, { qty: number; price: number }[]>;
};

export type SaleItem = {
  productId: string;
  name: string; // denormalized for historical record
  qty: number;
  price: number; // selling price at that time
  cogs?: number; // Cost of Goods Sold saat transaksi (Moving Average)
  subtotal: number;
  isWholesalePrice?: boolean;
  wholesalePrices?: { qty: number; price: number }[];
};

export type Sale = {
  id: string;
  invoice: string;
  date: string;
  customer: string;
  salesName: string;
  total: number;
  discount: number;
  grandTotal: number;
  method: 'Tunai' | 'Transfer' | 'Kredit';
  status: 'Lunas' | 'Belum Bayar' | 'Sebagian' | 'Selesai';
  items: SaleItem[];
  paymentRef?: string;
  notes?: string;
  cashGiven?: number; // bayar
  cashReturn?: number; // kembalian
  branchId?: string;
  userId?: string;
};

export type PurchaseItem = {
  productId: string;
  name: string;
  qty: number;
  price: number;
  subtotal: number;
  isWholesalePrice?: boolean;
  wholesalePrices?: { qty: number; price: number }[];
};

export type Purchase = {
  id: string;
  invoice: string;
  date: string;
  supplier: string;
  total: number;
  discount?: number;
  grandTotal?: number;
  method: 'Tunai' | 'Transfer' | 'Kredit';
  status: 'Lunas' | 'Belum Bayar' | 'Sebagian' | 'Diajukan' | 'Disetujui' | 'Selesai';
  items: PurchaseItem[];
  notes?: string;
  cashGiven?: number; // bayar
  pendingPayment?: number;
  paymentStatus?: string;
  isProcessed?: boolean;
  deliveryStatus?: string;
  destinationAdminId?: string;
  branchId?: string;
  userId?: string;
};

export type Delivery = {
  id: string;
  saleId: string;
  invoice: string;
  date: string;
  customerName: string;
  address: string;
  courier: string;
  status: 'Menunggu' | 'Dikirim' | 'Selesai';
  notes?: string;
  branchId?: string;
};

export type StockHistory = {
  id: string;
  date: string;
  productId: string;
  productName: string;
  type: 'Tambah' | 'Kurang';
  qty: number;
  prevStock: number;
  newStock: number;
  reason: string;
  userName: string;
  branchId?: string;
};

export type BranchDebt = {
  id: string;
  branchName: string;
  type: 'hutang' | 'piutang';
  amount: number;
};
