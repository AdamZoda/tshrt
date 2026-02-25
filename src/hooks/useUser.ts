import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';

export function useUserOrders() {
    const { user } = useAuth();
    const [orders, setOrders] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchOrders = async () => {
        if (!user) {
            setLoading(false);
            return;
        }
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('orders')
                .select(`
          *,
          order_items(*)
        `)
                .eq('user_id', user.id)
                .order('created_at', { ascending: false });

            if (error) throw error;
            setOrders(data || []);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchOrders();
    }, [user]);

    return { orders, loading, refetch: fetchOrders };
}

export function useSavedDesigns() {
    const { user } = useAuth();
    const [savedDesigns, setSavedDesigns] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchSavedDesigns = async () => {
        if (!user) {
            setLoading(false);
            return;
        }
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('saved_designs')
                .select('*')
                .eq('user_id', user.id)
                .order('created_at', { ascending: false });

            if (error) throw error;
            setSavedDesigns(data || []);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchSavedDesigns();
    }, [user]);

    const deleteSavedDesign = async (id: string) => {
        try {
            const { error } = await supabase.from('saved_designs').delete().eq('id', id);
            if (error) throw error;
            setSavedDesigns(prev => prev.filter(d => d.id !== id));
        } catch (err) {
            console.error('Failed to delete saved design', err);
        }
    };

    return { savedDesigns, loading, refetch: fetchSavedDesigns, deleteSavedDesign };
}
