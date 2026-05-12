'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Camera, Check } from 'lucide-react';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { useAuth } from '@/components/auth/AuthProvider';
import { api } from '@/lib/api';
import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { Input, Textarea } from '@/components/ui/Input';

function ProfileForm() {
  const { user, refreshUser } = useAuth();
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const [form, setForm] = useState({
    displayName: '',
    bio: '',
    location: '',
    preferredPayment: '',
  });

  useEffect(() => {
    if (user) {
      setForm({
        displayName: user.displayName || '',
        bio: user.bio || '',
        location: user.location || '',
        preferredPayment: user.preferredPayment || '',
      });
    }
  }, [user]);

  function updateField(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
    setSuccess(false);
  }

  async function handlePhotoUpload(file: File) {
    if (!user) return;
    try {
      const { url } = await api.uploadFile<{ url: string }>('/upload/avatar', file, 'file');
      await api.put('/auth/profile', { photoURL: url });
      await refreshUser();
    } catch (err: any) {
      setError(err.message || 'Failed to upload photo');
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setSaving(true);
    try {
      await api.put('/auth/profile', form);
      await refreshUser();
      setSuccess(true);
    } catch (err: any) {
      setError(err.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  }

  if (!user) return null;

  return (
    <div className="mx-auto max-w-2xl px-4 sm:px-6 py-8 sm:py-12">
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] as const }}
      >
        <h1 className="font-display text-3xl sm:text-4xl font-bold text-foreground uppercase tracking-tight">
          Edit Profile
        </h1>
        <p className="mt-2 text-sm text-foreground-secondary">
          This info is visible on your public profile.
        </p>

        {error && (
          <div className="mt-4 border border-accent p-3 text-sm text-accent font-medium">
            {error}
          </div>
        )}
        {success && (
          <div className="mt-4 border border-foreground p-3 text-sm text-foreground flex items-center gap-2 font-medium">
            <Check className="h-4 w-4" />
            Profile updated.
          </div>
        )}

        {/* Avatar */}
        <div className="mt-8 flex items-center gap-4">
          <div className="relative">
            <Avatar src={user.photoURL} name={user.displayName} size="xl" />
            <label className="absolute bottom-0 right-0 flex h-8 w-8 cursor-pointer items-center justify-center bg-accent text-white hover:opacity-80 transition-opacity">
              <Camera className="h-4 w-4" />
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handlePhotoUpload(file);
                }}
              />
            </label>
          </div>
          <div>
            <p className="font-display font-bold text-foreground uppercase tracking-[0.05em]">{user.displayName}</p>
            <p className="text-sm text-foreground-muted">{user.email}</p>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="mt-10 space-y-8">
          <Input
            id="displayName"
            label="Display Name"
            required
            maxLength={50}
            value={form.displayName}
            onChange={(e) => updateField('displayName', e.target.value)}
          />

          <div>
            <Textarea
              id="bio"
              label="Bio"
              maxLength={500}
              rows={3}
              value={form.bio}
              onChange={(e) => updateField('bio', e.target.value)}
              placeholder="Tell other collectors a bit about yourself..."
            />
            <p className="text-xs text-foreground-muted mt-1">{form.bio.length}/500</p>
          </div>

          <Input
            id="location"
            label="Location"
            maxLength={100}
            value={form.location}
            onChange={(e) => updateField('location', e.target.value)}
            placeholder="e.g., Los Angeles, CA"
          />

          <div>
            <Input
              id="preferredPayment"
              label="Preferred Payment Methods"
              maxLength={200}
              value={form.preferredPayment}
              onChange={(e) => updateField('preferredPayment', e.target.value)}
              placeholder="e.g., PayPal, Venmo, Zelle"
            />
            <p className="mt-1.5 text-xs text-foreground-muted">
              Shown on your profile so buyers know how to pay you.
            </p>
          </div>

          <Button type="submit" loading={saving} className="w-full">
            Save Profile
          </Button>
        </form>
      </motion.div>
    </div>
  );
}

export default function ProfilePage() {
  return (
    <ProtectedRoute>
      <ProfileForm />
    </ProtectedRoute>
  );
}
