import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { supabase } from '../lib/supabase';
import type { User, Session } from '@supabase/supabase-js';

export interface Profile {
    id: string;
    first_name: string;
    last_name: string;
    phone: string;
    address: string;
    city: string;
    role: 'user' | 'admin';
    avatar_url: string;
    is_blocked: boolean;
}

interface AuthContextType {
    user: User | null;
    profile: Profile | null;
    session: Session | null;
    loading: boolean;
    isAdmin: boolean;
    signUp: (email: string, password: string, firstName: string, lastName: string, phone: string) => Promise<{ error: any }>;
    signIn: (email: string, password: string) => Promise<{ error: any }>;
    signOut: () => Promise<void>;
    refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [profile, setProfile] = useState<Profile | null>(null);
    const [session, setSession] = useState<Session | null>(null);
    const [loading, setLoading] = useState(true);

    const fetchProfile = async (userId: string) => {
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 2000);

            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', userId)
                .abortSignal(controller.signal)
                .single();

            clearTimeout(timeoutId);

            if (!error && data) {
                setProfile(data as Profile);
            }
        } catch (err) {
            console.error("Failed to fetch profile:", err);
        }
    };

    const refreshProfile = async () => {
        if (user) await fetchProfile(user.id);
    };

    const userRef = useRef<string | null>(null);

    useEffect(() => {
        let isMounted = true;

        const initSession = async () => {
            try {
                const { data: { session }, error } = await supabase.auth.getSession();
                if (!isMounted) return;

                if (!error && session?.user) {
                    userRef.current = session.user.id;
                    setSession(session);
                    setUser(session.user);
                    fetchProfile(session.user.id);
                }
            } catch (err) {
                console.error("Auth init error:", err);
            } finally {
                if (isMounted) setLoading(false);
            }
        };

        initSession();

        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            async (event, session) => {
                if (!isMounted) return;

                if (event === 'SIGNED_OUT') {
                    userRef.current = null;
                    setUser(null);
                    setProfile(null);
                    setSession(null);
                    setLoading(false);
                    return;
                }

                const newUser = session?.user ?? null;

                // CRITICAL: Only update if the user has actually changed 
                // Use Ref to compare against the latest known user ID
                if (newUser?.id !== userRef.current) {
                    userRef.current = newUser?.id ?? null;
                    setSession(session);
                    setUser(newUser);
                    if (newUser) {
                        fetchProfile(newUser.id);
                    } else {
                        setProfile(null);
                    }
                }

                setLoading(false);
            }
        );

        return () => {
            isMounted = false;
            subscription.unsubscribe();
        };
    }, []); // Empty dependency array is correct for setting up the listener once

    const signUp = async (
        email: string,
        password: string,
        firstName: string,
        lastName: string,
        phone: string
    ) => {
        const { error } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: {
                    first_name: firstName,
                    last_name: lastName,
                    phone,
                },
            },
        });
        return { error };
    };

    const signIn = async (email: string, password: string) => {
        const { error } = await supabase.auth.signInWithPassword({
            email,
            password,
        });
        return { error };
    };

    const signOut = async () => {
        try {
            setLoading(true);
            await supabase.auth.signOut();
            setUser(null);
            setProfile(null);
            setSession(null);
            localStorage.clear(); // Nuclear option to clear any "ghost" sessions
        } catch (err) {
            console.error("Signout error", err);
        } finally {
            setLoading(false);
        }
    };

    const isAdmin = profile?.role === 'admin';

    return (
        <AuthContext.Provider
            value={{
                user,
                profile,
                session,
                loading,
                isAdmin,
                signUp,
                signIn,
                signOut,
                refreshProfile,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}
