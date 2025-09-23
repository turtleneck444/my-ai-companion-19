import { useEffect, useMemo, useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';

function setAgeCookie(value: { country: string; yob: number; exp: number }) {
  try {
    const cookie = `loveai_age=${btoa(JSON.stringify(value))}; Path=/; Max-Age=${60 * 60 * 24 * 90}; SameSite=Lax`;
    document.cookie = cookie;
  } catch {}
}

function getAgeThreshold(country: string): number {
  // Minimal mapping; extend as needed
  const map: Record<string, number> = {
    US: 18, GB: 18, CA: 18, AU: 18, DE: 18, FR: 18, JP: 18, IN: 18,
  };
  return map[country] || 18;
}

function isOfAge(country: string, yearOfBirth: number): boolean {
  const threshold = getAgeThreshold(country);
  const currentYear = new Date().getFullYear();
  const age = currentYear - yearOfBirth;
  return age >= threshold && age < 120;
}

export function isAgeVerified(): boolean {
  try {
    if (localStorage.getItem('loveai-age-verified') === 'true') return true;
    const match = document.cookie.match(/(?:^|; )loveai_age=([^;]+)/);
    if (!match) return false;
    const data = JSON.parse(atob(match[1]));
    return typeof data?.exp === 'number' && data.exp > Date.now();
  } catch {
    return false;
  }
}

export const AgeGate = () => {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<'country' | 'yob'>('country');
  const [country, setCountry] = useState('US');
  const [yob, setYob] = useState<number | ''>('');
  const years = useMemo(() => {
    const now = new Date().getFullYear();
    return Array.from({ length: 100 }, (_, i) => now - i);
  }, []);

  useEffect(() => {
    const verified = localStorage.getItem('loveai-age-verified');
    if (!verified) setOpen(true);
  }, []);

  const handleCountryNext = () => setStep('yob');

  const handleConfirm = () => {
    if (typeof yob !== 'number') return;
    const ok = isOfAge(country, yob);
    if (!ok) {
      window.location.href = 'https://www.google.com';
      return;
    }
    const exp = Date.now() + 1000 * 60 * 60 * 24 * 90; // 90 days
    setAgeCookie({ country, yob, exp });
    localStorage.setItem('loveai-age-verified', 'true');
    setOpen(false);
  };

  const handleDecline = () => {
    window.location.href = 'https://www.google.com';
  };

  return (
    <Dialog open={open}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Age verification</DialogTitle>
          <DialogDescription>
            We ask for your country and year of birth to apply the correct age threshold. We don’t store your full date of birth.
          </DialogDescription>
        </DialogHeader>
        <Card>
          <CardContent className="pt-6 space-y-4">
            {step === 'country' && (
              <div className="space-y-3">
                <Label htmlFor="country">Country</Label>
                <select id="country" className="w-full border rounded-md p-2" value={country} onChange={(e) => setCountry(e.target.value)}>
                  <option value="US">United States</option>
                  <option value="GB">United Kingdom</option>
                  <option value="CA">Canada</option>
                  <option value="AU">Australia</option>
                  <option value="DE">Germany</option>
                  <option value="FR">France</option>
                  <option value="JP">Japan</option>
                  <option value="IN">India</option>
                </select>
                <div className="flex gap-3 pt-2">
                  <Button className="flex-1" onClick={handleCountryNext}>Next</Button>
                  <Button variant="outline" className="flex-1" onClick={handleDecline}>No</Button>
                </div>
              </div>
            )}

            {step === 'yob' && (
              <div className="space-y-3">
                <Label htmlFor="yob">Year of birth</Label>
                <select id="yob" className="w-full border rounded-md p-2" value={yob} onChange={(e) => setYob(parseInt(e.target.value))}>
                  <option value="">Select year</option>
                  {years.map(y => (
                    <option key={y} value={y}>{y}</option>
                  ))}
                </select>
                <div className="text-xs text-muted-foreground">Required age in {country}: {getAgeThreshold(country)}+</div>
                <div className="flex gap-3 pt-2">
                  <Button className="flex-1" onClick={handleConfirm} disabled={typeof yob !== 'number'}>Confirm</Button>
                  <Button variant="outline" className="flex-1" onClick={() => setStep('country')}>Back</Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </DialogContent>
    </Dialog>
  );
}; 