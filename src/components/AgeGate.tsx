import { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

export const AgeGate = () => {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const verified = localStorage.getItem('loveai-age-verified');
    if (!verified) setOpen(true);
  }, []);

  const handleConfirm = () => {
    localStorage.setItem('loveai-age-verified', 'true');
    setOpen(false);
  };

  const handleDecline = () => {
    // Redirect away for under 18
    window.location.href = 'https://www.google.com';
  };

  return (
    <Dialog open={open}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Are you 18 or older?</DialogTitle>
          <DialogDescription>
            LoveAI may contain mature themes. Please confirm your age to continue.
          </DialogDescription>
        </DialogHeader>
        <Card>
          <CardContent className="pt-6 flex gap-3">
            <Button className="flex-1" onClick={handleConfirm}>Yes, I am 18+</Button>
            <Button variant="outline" className="flex-1" onClick={handleDecline}>No</Button>
          </CardContent>
        </Card>
      </DialogContent>
    </Dialog>
  );
}; 