'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { ImagePlus, X, DollarSign } from 'lucide-react';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { useAuth } from '@/components/auth/AuthProvider';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/Button';
import { Input, Textarea } from '@/components/ui/Input';
import { Skeleton } from '@/components/ui/Skeleton';
import type { Listing } from '@scentresort/shared';

function EditListingForm() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [error, setError] = useState('');
  const [existingImages, setExistingImages] = useState<string[]>([]);
  const [newImageFiles, setNewImageFiles] = useState<File[]>([]);
  const [newPreviews, setNewPreviews] = useState<string[]>([]);

  const [form, setForm] = useState({
    title: '',
    description: '',
    brand: '',
    fragranceName: '',
    size: '',
    condition: 'new_sealed',
    price: '',
  });

  useEffect(() => {
    api
      .get<Listing>(`/listings/${id}`)
      .then((listing) => {
        if (user && listing.sellerId !== user.uid) {
          router.push(`/listings/${id}`);
          return;
        }
        setForm({
          title: listing.title,
          description: listing.description,
          brand: listing.brand,
          fragranceName: listing.fragranceName,
          size: listing.size,
          condition: listing.condition,
          price: (listing.price / 100).toFixed(2),
        });
        setExistingImages(listing.images);
      })
      .catch(() => router.push('/listings'))
      .finally(() => setFetching(false));
  }, [id, user, router]);

  function updateField(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function removeExistingImage(index: number) {
    setExistingImages((prev) => prev.filter((_, i) => i !== index));
  }

  function handleNewImages(files: FileList | null) {
    if (!files) return;
    const totalSlots = 5 - existingImages.length;
    const newFiles = Array.from(files).slice(0, totalSlots - newImageFiles.length);
    const updated = [...newImageFiles, ...newFiles].slice(0, totalSlots);
    setNewImageFiles(updated);
    setNewPreviews(updated.map((f) => URL.createObjectURL(f)));
  }

  function removeNewImage(index: number) {
    const updated = newImageFiles.filter((_, i) => i !== index);
    setNewImageFiles(updated);
    setNewPreviews(updated.map((f) => URL.createObjectURL(f)));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      let uploadedUrls: string[] = [];
      if (newImageFiles.length > 0) {
        const { urls } = await api.uploadFiles<{ urls: string[] }>(
          '/upload/listing-images', newImageFiles, 'images'
        );
        uploadedUrls = urls;
      }

      const allImages = [...existingImages, ...uploadedUrls];

      const priceInCents = Math.round(parseFloat(form.price) * 100);
      if (isNaN(priceInCents) || priceInCents <= 0) {
        setError('Please enter a valid price');
        setLoading(false);
        return;
      }

      await api.put(`/listings/${id}`, {
        ...form,
        price: priceInCents,
        currency: 'usd',
        images: allImages,
      });

      router.push(`/listings/${id}`);
    } catch (err: any) {
      setError(err.message || 'Failed to update listing');
    } finally {
      setLoading(false);
    }
  }

  if (fetching) {
    return (
      <div className="mx-auto max-w-2xl px-4 sm:px-6 py-8 sm:py-12 space-y-6">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-64" />
      </div>
    );
  }

  const totalImages = existingImages.length + newImageFiles.length;

  return (
    <div className="mx-auto max-w-2xl px-4 sm:px-6 py-8 sm:py-12">
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] as const }}
      >
        <h1 className="font-display text-3xl sm:text-4xl font-bold text-foreground uppercase tracking-tight">
          Edit Listing
        </h1>
        <p className="mt-2 text-sm text-foreground-secondary">
          Update your listing details.
        </p>

        {error && (
          <div className="mt-4 border border-accent p-3 text-sm text-accent font-medium">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-8 space-y-8">
          {/* Photos */}
          <div>
            <label className="block text-xs font-bold text-foreground uppercase tracking-[0.15em] mb-3">
              Photos (up to 5)
            </label>
            <div className="grid grid-cols-3 sm:grid-cols-5 gap-3">
              {existingImages.map((url, i) => (
                <div key={`existing-${i}`} className="relative aspect-square overflow-hidden border border-border">
                  <img src={url} alt="" className="h-full w-full object-cover" />
                  <button
                    type="button"
                    onClick={() => removeExistingImage(i)}
                    className="absolute top-1.5 right-1.5 flex h-6 w-6 items-center justify-center bg-foreground text-background hover:bg-accent transition-colors"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
              {newPreviews.map((url, i) => (
                <div key={`new-${i}`} className="relative aspect-square overflow-hidden border border-border">
                  <img src={url} alt="" className="h-full w-full object-cover" />
                  <button
                    type="button"
                    onClick={() => removeNewImage(i)}
                    className="absolute top-1.5 right-1.5 flex h-6 w-6 items-center justify-center bg-foreground text-background hover:bg-accent transition-colors"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
              {totalImages < 5 && (
                <label className="flex aspect-square cursor-pointer flex-col items-center justify-center border-2 border-dashed border-border hover:border-accent transition-colors">
                  <ImagePlus className="h-6 w-6 text-foreground-muted" />
                  <span className="mt-1 text-xs text-foreground-muted uppercase tracking-wide">Add</span>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                    onChange={(e) => handleNewImages(e.target.files)}
                  />
                </label>
              )}
            </div>
          </div>

          {/* Title */}
          <Input
            id="title"
            label="Title"
            required
            value={form.title}
            onChange={(e) => updateField('title', e.target.value)}
            placeholder="e.g., Tom Ford Oud Wood EDP 100ml"
          />

          {/* Brand + Fragrance */}
          <div className="grid grid-cols-2 gap-6">
            <Input
              id="brand"
              label="Brand"
              required
              value={form.brand}
              onChange={(e) => updateField('brand', e.target.value)}
              placeholder="e.g., Tom Ford"
            />
            <Input
              id="fragranceName"
              label="Fragrance Name"
              required
              value={form.fragranceName}
              onChange={(e) => updateField('fragranceName', e.target.value)}
              placeholder="e.g., Oud Wood"
            />
          </div>

          {/* Size + Condition + Price */}
          <div className="grid grid-cols-3 gap-4">
            <Input
              id="size"
              label="Size"
              required
              value={form.size}
              onChange={(e) => updateField('size', e.target.value)}
              placeholder="e.g., 100ml"
            />
            <div>
              <label htmlFor="condition" className="block text-xs font-bold text-foreground uppercase tracking-[0.15em] mb-2">
                Condition
              </label>
              <select
                id="condition"
                value={form.condition}
                onChange={(e) => updateField('condition', e.target.value)}
                className="block w-full border-b-2 border-border bg-transparent py-3 text-sm text-foreground focus:border-accent focus:outline-none transition-colors"
              >
                <option value="new_sealed">New (Sealed)</option>
                <option value="new_open_box">New (Open Box)</option>
                <option value="lightly_used">Lightly Used</option>
                <option value="partially_used">Partially Used</option>
              </select>
            </div>
            <div>
              <label htmlFor="price" className="block text-xs font-bold text-foreground uppercase tracking-[0.15em] mb-2">
                Price (USD)
              </label>
              <div className="relative">
                <DollarSign className="absolute left-0 top-1/2 -translate-y-1/2 h-4 w-4 text-foreground-muted" />
                <input
                  id="price"
                  required
                  type="number"
                  step="0.01"
                  min="1"
                  value={form.price}
                  onChange={(e) => updateField('price', e.target.value)}
                  placeholder="0.00"
                  className="block w-full border-b-2 border-border bg-transparent pl-6 pr-0 py-3 text-sm text-foreground placeholder:text-foreground-muted focus:border-accent focus:outline-none transition-colors"
                />
              </div>
            </div>
          </div>

          {/* Description */}
          <Textarea
            id="description"
            label="Description"
            required
            minLength={10}
            rows={4}
            value={form.description}
            onChange={(e) => updateField('description', e.target.value)}
            placeholder="Describe the fragrance, its condition, and why you're selling..."
          />

          {/* Price preview */}
          {form.price && !isNaN(parseFloat(form.price)) && parseFloat(form.price) > 0 && (
            <div className="border border-border p-6 text-center">
              <p className="text-xs font-bold text-foreground-secondary uppercase tracking-[0.15em]">Your listing price</p>
              <p className="mt-2 font-display text-4xl font-bold text-foreground">
                ${parseFloat(form.price).toFixed(2)}
              </p>
            </div>
          )}

          <Button type="submit" loading={loading} className="w-full" size="lg">
            {loading ? 'Saving changes...' : 'Save Changes'}
          </Button>
        </form>
      </motion.div>
    </div>
  );
}

export default function EditListingPage() {
  return (
    <ProtectedRoute>
      <EditListingForm />
    </ProtectedRoute>
  );
}
