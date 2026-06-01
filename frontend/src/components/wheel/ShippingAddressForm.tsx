'use client';

import { useState } from 'react';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import type { ShippingAddress } from '@scentresort/shared';

const US_STATES = [
  'AL','AK','AZ','AR','CA','CO','CT','DE','FL','GA','HI','ID','IL','IN','IA',
  'KS','KY','LA','ME','MD','MA','MI','MN','MS','MO','MT','NE','NV','NH','NJ',
  'NM','NY','NC','ND','OH','OK','OR','PA','RI','SC','SD','TN','TX','UT','VT',
  'VA','WA','WV','WI','WY','DC',
];

interface Props {
  onSubmit: (address: ShippingAddress) => void;
  onCancel: () => void;
  loading?: boolean;
}

export function ShippingAddressForm({ onSubmit, onCancel, loading }: Props) {
  const [fullName, setFullName] = useState('');
  const [line1, setLine1] = useState('');
  const [line2, setLine2] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  function validate(): boolean {
    const errs: Record<string, string> = {};
    if (!fullName.trim()) errs.fullName = 'Required';
    if (!line1.trim()) errs.line1 = 'Required';
    if (!city.trim()) errs.city = 'Required';
    if (!state) errs.state = 'Required';
    if (!postalCode.trim()) errs.postalCode = 'Required';
    else if (!/^\d{5}(-\d{4})?$/.test(postalCode.trim())) errs.postalCode = 'Invalid ZIP';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    onSubmit({
      fullName: fullName.trim(),
      line1: line1.trim(),
      line2: line2.trim() || undefined,
      city: city.trim(),
      state,
      postalCode: postalCode.trim(),
      country: 'US',
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <h3 className="font-display text-sm font-bold uppercase tracking-[0.05em] text-foreground-secondary">
        Shipping Address
      </h3>

      <Input
        label="Full Name"
        id="fullName"
        value={fullName}
        onChange={(e) => setFullName(e.target.value)}
        error={errors.fullName}
        placeholder="John Doe"
      />

      <Input
        label="Address Line 1"
        id="line1"
        value={line1}
        onChange={(e) => setLine1(e.target.value)}
        error={errors.line1}
        placeholder="123 Main St"
      />

      <Input
        label="Address Line 2"
        id="line2"
        value={line2}
        onChange={(e) => setLine2(e.target.value)}
        placeholder="Apt 4B (optional)"
      />

      <div className="grid grid-cols-3 gap-3">
        <div className="col-span-1">
          <Input
            label="City"
            id="city"
            value={city}
            onChange={(e) => setCity(e.target.value)}
            error={errors.city}
          />
        </div>
        <div className="col-span-1">
          <label htmlFor="state" className="block text-xs font-bold text-foreground uppercase tracking-[0.15em] mb-2">
            State
          </label>
          <select
            id="state"
            value={state}
            onChange={(e) => setState(e.target.value)}
            className="block w-full border-b-2 border-border bg-transparent px-0 py-3 text-sm text-foreground focus:border-accent focus:outline-none"
          >
            <option value="">--</option>
            {US_STATES.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
          {errors.state && <p className="mt-1.5 text-xs text-accent font-medium">{errors.state}</p>}
        </div>
        <div className="col-span-1">
          <Input
            label="ZIP"
            id="postalCode"
            value={postalCode}
            onChange={(e) => setPostalCode(e.target.value)}
            error={errors.postalCode}
            placeholder="10001"
          />
        </div>
      </div>

      <div className="flex gap-3 pt-2">
        <Button type="submit" variant="primary" size="md" loading={loading} className="flex-1">
          Submit
        </Button>
        <Button type="button" variant="secondary" size="md" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
