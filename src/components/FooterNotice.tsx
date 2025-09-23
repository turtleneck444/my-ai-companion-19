import React from 'react';

export const FooterNotice: React.FC = () => {
  return (
    <div className="w-full border-t bg-background/70 backdrop-blur px-4 py-3 text-center text-xs text-muted-foreground">
      This is a new, futuristic platform. If you experience any bugs, please email
      {' '}<a href="mailto:Hunain@CardinalHTX.com" className="underline hover:text-foreground">Hunain@CardinalHTX.com</a>.
      Thanks for bearing with us!
    </div>
  );
}; 