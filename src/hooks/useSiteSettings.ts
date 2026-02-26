import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export function useSiteSettings<T = any>(key: string) {
    const [value, setValue] = useState<T | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetch = async () => {
            try {
                const { data } = await supabase
                    .from('site_settings')
                    .select('value')
                    .eq('key', key)
                    .single();
                setValue(data?.value as T ?? null);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetch();
    }, [key]);

    const update = async (newValue: T) => {
        const { error } = await supabase
            .from('site_settings')
            .update({ value: newValue })
            .eq('key', key);
        if (!error) setValue(newValue);
        return { error };
    };

    return { value, loading, update };
}

export interface FeaturedDesign {
    id: string;
    title: string;
    category: string;
    image_url: string;
    is_featured: boolean;
    sort_order: number;
    link_url: string;
}

export function useFeaturedDesigns() {
    const [designs, setDesigns] = useState<FeaturedDesign[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchDesigns = async () => {
        try {
            const { data } = await supabase
                .from('featured_designs')
                .select('*')
                .order('sort_order');
            setDesigns((data as FeaturedDesign[]) || []);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchDesigns(); }, []);

    const addDesign = async (design: Partial<FeaturedDesign>) => {
        const { data, error } = await supabase
            .from('featured_designs')
            .insert([design])
            .select()
            .single();
        if (!error && data) {
            setDesigns(prev => [...prev, data as FeaturedDesign]);
        }
        return { data, error };
    };

    const updateDesign = async (id: string, updates: Partial<FeaturedDesign>) => {
        const { data, error } = await supabase
            .from('featured_designs')
            .update(updates)
            .eq('id', id)
            .select()
            .single();
        if (!error && data) {
            setDesigns(prev => prev.map(d => d.id === id ? (data as FeaturedDesign) : d));
        }
        return { data, error };
    };

    const deleteDesign = async (id: string) => {
        const { error } = await supabase
            .from('featured_designs')
            .delete()
            .eq('id', id);
        if (!error) {
            setDesigns(prev => prev.filter(d => d.id !== id));
        }
        return { error };
    };

    return { designs, loading, addDesign, updateDesign, deleteDesign, refresh: fetchDesigns };
}
