import { useEffect } from 'react';
import { usePosStore } from '../store';
import {
  useUsers,
  useProducts,
  useSales,
  usePurchases,
  useCategories,
  useUnits,
  useCustomers,
  useSuppliers,
  useDeliveries,
  useStockHistory,
  useBranches
} from '../hooks/queries';

export default function DataSynchronizer() {
  const { data: users } = useUsers();
  const { data: products } = useProducts();
  const { data: sales } = useSales();
  const { data: purchases } = usePurchases();
  const { data: categories } = useCategories();
  const { data: units } = useUnits();
  const { data: customers } = useCustomers();
  const { data: suppliers } = useSuppliers();
  const { data: deliveries } = useDeliveries();
  const { data: stockHistory } = useStockHistory();
  const { data: branches } = useBranches();

  useEffect(() => {
    if (Array.isArray(users)) usePosStore.setState({ users });
  }, [users]);

  useEffect(() => {
    if (Array.isArray(products)) usePosStore.setState({ products });
  }, [products]);

  useEffect(() => {
    if (Array.isArray(sales)) usePosStore.setState({ sales });
  }, [sales]);

  useEffect(() => {
    if (Array.isArray(purchases)) usePosStore.setState({ purchases });
  }, [purchases]);

  useEffect(() => {
    if (Array.isArray(categories)) usePosStore.setState({ categories });
  }, [categories]);

  useEffect(() => {
    if (Array.isArray(units)) usePosStore.setState({ units });
  }, [units]);

  useEffect(() => {
    if (Array.isArray(customers)) usePosStore.setState({ customers });
  }, [customers]);

  useEffect(() => {
    if (Array.isArray(suppliers)) usePosStore.setState({ suppliers });
  }, [suppliers]);

  useEffect(() => {
    if (Array.isArray(deliveries)) usePosStore.setState({ deliveries });
  }, [deliveries]);

  useEffect(() => {
    if (Array.isArray(stockHistory)) usePosStore.setState({ stockHistory });
  }, [stockHistory]);

  useEffect(() => {
    if (Array.isArray(branches)) usePosStore.setState({ branches });
  }, [branches]);

  return null;
}
