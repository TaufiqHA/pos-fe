import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../lib/axios';
import { usePosStore } from '../store';

// Users
export const useUsers = () => useQuery({ queryKey: ['users'], queryFn: () => api.get('/users').then(res => Array.isArray(res.data) ? res.data : []) });

// Products
export const useProducts = () => useQuery({ queryKey: ['products'], queryFn: () => api.get('/products').then(res => Array.isArray(res.data) ? res.data : []) });

// Sales
export const useSales = () => {
  const user = usePosStore(state => state.user);
  return useQuery({
    queryKey: ['sales', user?.id],
    queryFn: () => {
      const url = user?.role === 'Admin' ? '/sales?destination_type=cabang' : '/sales';
      return api.get(url).then(res => Array.isArray(res.data) ? res.data : []);
    }
  });
};

// Purchases
export const usePurchases = () => useQuery({ queryKey: ['purchases'], queryFn: () => api.get('/purchases').then(res => Array.isArray(res.data) ? res.data : []), refetchInterval: 5000 });

// Categories & Units
export const useCategories = () => useQuery({ queryKey: ['categories'], queryFn: () => api.get('/categories').then(res => Array.isArray(res.data) ? res.data.map((c: any) => c.name) : []) });
export const useUnits = () => useQuery({ queryKey: ['units'], queryFn: () => api.get('/units').then(res => Array.isArray(res.data) ? res.data.map((u: any) => u.name) : []) });

// Customers & Suppliers
export const useCustomers = () => useQuery({ queryKey: ['customers'], queryFn: () => api.get('/customers').then(res => Array.isArray(res.data) ? res.data : []) });
export const useSuppliers = () => useQuery({ queryKey: ['suppliers'], queryFn: () => api.get('/suppliers').then(res => Array.isArray(res.data) ? res.data : []) });

// Deliveries
export const useDeliveries = () => useQuery({ queryKey: ['deliveries'], queryFn: () => api.get('/deliveries').then(res => Array.isArray(res.data) ? res.data : []), refetchInterval: 5000 });

// Stock History & Branches
export const useStockHistory = () => useQuery({ queryKey: ['stockHistory'], queryFn: () => api.get('/stock-history').then(res => Array.isArray(res.data) ? res.data : []) });
export const useBranches = () => useQuery({ queryKey: ['branches'], queryFn: () => api.get('/branches').then(res => Array.isArray(res.data) ? res.data : []) });
