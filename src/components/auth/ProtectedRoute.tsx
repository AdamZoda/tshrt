import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

interface ProtectedRouteProps {
    children: React.ReactNode;
    requireAdmin?: boolean;
}

export function ProtectedRoute({ children, requireAdmin = false }: ProtectedRouteProps) {
    const { user, profile, loading, isAdmin } = useAuth();
    if (loading) {
        return (
            <div className="fixed top-0 left-0 right-0 h-1 bg-white/5 z-50">
                <div className="h-full w-full bg-[#D4AF37] opacity-60 animate-pulse" />
            </div>
        );
    }

    if (!user) {
        return <Navigate to="/login" replace />;
    }

    if (requireAdmin && !isAdmin) {
        return <Navigate to="/" replace />;
    }

    if (profile?.is_blocked) {
        return (
            <div className="min-h-screen bg-[#0F0F0F] flex items-center justify-center p-6">
                <div className="text-center">
                    <h1 className="text-2xl font-bold text-[#E63946] mb-4">Compte bloqué</h1>
                    <p className="text-white/60">Votre compte a été suspendu. Contactez le support.</p>
                </div>
            </div>
        );
    }

    return <>{children}</>;
}
