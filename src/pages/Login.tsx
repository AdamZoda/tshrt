import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { Button } from '../components/ui/Button';
import { useAuth } from '../context/AuthContext';

export function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { signIn } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const { error } = await signIn(email, password);

      if (error) {
        setError(
          error.message === 'Invalid login credentials'
            ? 'Email ou mot de passe incorrect.'
            : error.message
        );
      } else {
        navigate('/dashboard');
      }
    } catch (err: any) {
      console.error("Login attempt failed:", err);
      setError("Une erreur de réseau est survenue. Veuillez réessayer.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0F0F0F] flex items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md bg-[#181818] p-8 md:p-12 rounded-3xl border border-white/10"
      >
        <div className="text-center mb-10">
          <h1 className="text-3xl font-bold tracking-tighter mb-2">Connexion</h1>
          <p className="text-white/60">Connectez-vous pour accéder à vos designs et commandes.</p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-[#E63946]/10 border border-[#E63946]/30 rounded-xl text-[#E63946] text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <label className="text-sm font-medium text-white/60">Adresse email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-[#0F0F0F] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#D4AF37] transition-colors"
              placeholder="vous@exemple.com"
            />
          </div>
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <label className="text-sm font-medium text-white/60">Mot de passe</label>
              <a href="#" className="text-xs text-[#D4AF37] hover:underline">Mot de passe oublié ?</a>
            </div>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-[#0F0F0F] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#D4AF37] transition-colors"
              placeholder="••••••••"
            />
          </div>

          <Button
            type="submit"
            className="w-full bg-[#D4AF37] text-black hover:bg-white"
            size="lg"
            disabled={loading}
          >
            {loading ? 'Connexion en cours...' : 'Se connecter'}
          </Button>
        </form>

        <p className="text-center text-white/60 mt-8 text-sm">
          Pas encore de compte ?{' '}
          <Link to="/register" className="text-white hover:text-[#D4AF37] font-medium transition-colors">
            Créer un compte
          </Link>
        </p>
      </motion.div>
    </div>
  );
}
