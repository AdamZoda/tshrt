import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { Button } from '../components/ui/Button';
import { useAuth } from '../context/AuthContext';

export function Register() {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const { signUp } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (password !== confirmPassword) {
      setError('Les mots de passe ne correspondent pas.');
      return;
    }
    if (password.length < 6) {
      setError('Le mot de passe doit contenir au moins 6 caractères.');
      return;
    }

    setLoading(true);
    const { error } = await signUp(email, password, firstName, lastName, phone);

    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      setSuccess('Compte créé ! Vérifiez votre email pour confirmer votre inscription.');
      setTimeout(() => navigate('/login'), 1000);
    }
  };

  return (
    <div className="min-h-screen bg-[#0F0F0F] flex items-center justify-center p-6 py-20">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-lg bg-[#181818] p-8 md:p-12 rounded-3xl border border-white/10"
      >
        <div className="text-center mb-10">
          <h1 className="text-3xl font-bold tracking-tighter mb-2">Créer un compte</h1>
          <p className="text-white/60">Rejoignez Bocharwit pour sauvegarder vos designs et suivre vos commandes.</p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-[#E63946]/10 border border-[#E63946]/30 rounded-xl text-[#E63946] text-sm">
            {error}
          </div>
        )}
        {success && (
          <div className="mb-6 p-4 bg-green-500/10 border border-green-500/30 rounded-xl text-green-400 text-sm">
            {success}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-medium text-white/60">Prénom</label>
              <input
                type="text" required value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                className="w-full bg-[#0F0F0F] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#D4AF37] transition-colors"
                placeholder="Ahmed"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-white/60">Nom</label>
              <input
                type="text" required value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                className="w-full bg-[#0F0F0F] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#D4AF37] transition-colors"
                placeholder="Benali"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-white/60">Adresse email</label>
            <input
              type="email" required value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-[#0F0F0F] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#D4AF37] transition-colors"
              placeholder="vous@exemple.com"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-white/60">Numéro de téléphone</label>
            <input
              type="tel" required value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full bg-[#0F0F0F] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#D4AF37] transition-colors"
              placeholder="+212 600 000 000"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-white/60">Mot de passe</label>
            <input
              type="password" required value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-[#0F0F0F] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#D4AF37] transition-colors"
              placeholder="••••••••"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-white/60">Confirmer le mot de passe</label>
            <input
              type="password" required value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full bg-[#0F0F0F] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#D4AF37] transition-colors"
              placeholder="••••••••"
            />
          </div>

          <Button type="submit" className="w-full bg-[#D4AF37] text-black hover:bg-white" size="lg" disabled={loading}>
            {loading ? 'Création en cours...' : 'Créer mon compte'}
          </Button>
        </form>

        <p className="text-center text-white/60 mt-8 text-sm">
          Déjà un compte ?{' '}
          <Link to="/login" className="text-white hover:text-[#D4AF37] font-medium transition-colors">
            Se connecter
          </Link>
        </p>
      </motion.div>
    </div>
  );
}
