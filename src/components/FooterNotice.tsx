import React from 'react';

export const FooterNotice: React.FC = () => {
  return (
    <div className="fixed left-0 right-0 bottom-16 md:bottom-0 z-40 border-t bg-background/90 backdrop-blur px-4 py-3 text-center text-xs text-muted-foreground shadow-sm">
      This is a new, futuristic platform. If you experience any bugs, please email
      {' '}<a href="mailto:Hunain@CardinalHTX.com" className="underline hover:text-foreground">Hunain@CardinalHTX.com</a>.
      Thanks for bearing with us!
    </div>
  );
}; 