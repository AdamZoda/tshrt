import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export function useAdminStats() {
    const [stats, setStats] = useState({
        totalRevenue: 0,
        totalOrders: 0,
        activeUsers: 0,
        conversionRate: 0,
    });
    const [loading, setLoading] = useState(true);

    const fetchStats = async () => {
        try {
            // Fetch total orders and revenue
            const { data: ordersData, error: ordersError } = await supabase
                .from('orders')
                .select('total_amount, status');

            if (!ordersError && ordersData) {
                const totalRev = ordersData.reduce((sum, order) => sum + Number(order.total_amount), 0);

                // Active Users
                const { count: usersCount } = await supabase
                    .from('profiles')
                    .select('*', { count: 'exact', head: true });

                // Simple mock conversion for demo
                setStats({
                    totalRevenue: totalRev,
                    totalOrders: ordersData.length,
                    activeUsers: usersCount || 0,
                    conversionRate: 3.2,
                });
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchStats();
    }, []);

    return { stats, loading, refetch: fetchStats };
}

export function useAdminOrders() {
    const [orders, setOrders] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchOrders = async () => {
        try {
            const { data, error } = await supabase
                .from('orders')
                .select(`
          *,
          profiles:user_id(first_name, last_name, email, phone),
          order_items(*)
        `)
                .order('created_at', { ascending: false });

            if (error) throw error;
            setOrders(data || []);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const updateOrderStatus = async (id: string, status: string) => {
        const { error } = await supabase.from('orders').update({ status }).eq('id', id);
        if (!error) {
            setOrders(prev => prev.map(o => o.id === id ? { ...o, status } : o));
        }
        return { error };
    };

    useEffect(() => {
        fetchOrders();
    }, []);

    return { orders, loading, updateOrderStatus, refetch: fetchOrders };
}
