import React from 'react';
import { Link } from 'react-router-dom';
import { Mail, HelpCircle, Shield, FileText } from 'lucide-react';

export const FooterNotice: React.FC = () => {
  return (
    <div className="w-full border-t bg-background/80 backdrop-blur px-4 py-6">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-4">
          {/* Support */}
          <div>
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <HelpCircle className="h-4 w-4" />
              Support
            </h3>
            <div className="space-y-2 text-sm text-muted-foreground">
              <div>
                <Link to="/support" className="hover:text-foreground transition-colors">
                  Contact Support
                </Link>
              </div>
              <div>
                <a 
                  href="mailto:support@loveaicompanion.com" 
                  className="hover:text-foreground transition-colors flex items-center gap-1"
                >
                  <Mail className="h-3 w-3" />
                  support@loveaicompanion.com
                </a>
              </div>
            </div>
          </div>

          {/* Legal */}
          <div>
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <Shield className="h-4 w-4" />
              Legal
            </h3>
            <div className="space-y-2 text-sm text-muted-foreground">
              <div>
                <Link to="/terms" className="hover:text-foreground transition-colors">
                  Terms of Service
                </Link>
              </div>
              <div>
                <Link to="/privacy" className="hover:text-foreground transition-colors">
                  Privacy Policy
                </Link>
              </div>
            </div>
          </div>

          {/* Company */}
          <div>
            <h3 className="font-semibold mb-3">Company</h3>
            <div className="space-y-2 text-sm text-muted-foreground">
              <div>LoveAI Companion</div>
              <div>AI-Powered Relationships</div>
            </div>
          </div>

          {/* Contact */}
          <div>
            <h3 className="font-semibold mb-3">Contact</h3>
            <div className="space-y-2 text-sm text-muted-foreground">
              <div>support@loveaicompanion.com</div>
              <div className="text-xs">
                Response time: 24-48 hours
              </div>
            </div>
          </div>
        </div>

        <div className="border-t pt-4 text-center text-xs text-muted-foreground">
          <div className="mb-2">
            This is a new, futuristic platform. If you experience any bugs, please email{' '}
            <a href="mailto:support@loveaicompanion.com" className="underline hover:text-foreground">
              support@loveaicompanion.com
            </a>.
          </div>
          <div>© 2024 LoveAI Companion. All rights reserved.</div>
        </div>
      </div>
    </div>
  );
};
