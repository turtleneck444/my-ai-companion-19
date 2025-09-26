import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function TermsOfService() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 py-10 px-4">
      <div className="max-w-3xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle className="text-3xl">LoveAI Terms of Service</CardTitle>
          </CardHeader>
          <CardContent className="prose max-w-none">
            <p><strong>Effective date:</strong> {new Date().toLocaleDateString()}</p>

            <h2>1. Agreement</h2>
            <p>
              By using LoveAI you agree to these Terms and our Privacy Policy. If you do not agree, do not use the service.
            </p>

            <h2>2. Eligibility</h2>
            <p>You must be at least 18 (or the age of majority in your jurisdiction) to use LoveAI.</p>

            <h2>3. Accounts</h2>
            <ul>
              <li>Provide accurate information and keep your credentials secure.</li>
              <li>You are responsible for all activity under your account.</li>
            </ul>

            <h2>4. Acceptable Use</h2>
            <p>You agree not to:</p>
            <ul>
              <li>Be hateful, harass, threaten, or otherwise engage in abusive/offensive behavior.</li>
              <li>Attempt to hack, probe, or disrupt the service (including scraping, rate abuse, or bypassing limits).</li>
              <li>Upload malware or content that infringes others’ rights or violates law.</li>
              <li>Misuse AI outputs (e.g., impersonation, deceptive activity, or illegal use).</li>
            </ul>
            <p>
              We may suspend or ban accounts for violations. Repeated or severe violations may result in permanent termination.
            </p>

            <h2>5. Content & AI Outputs</h2>
            <ul>
              <li>AI outputs may be inaccurate. Do not rely on them for professional advice.</li>
              <li>You are responsible for how you use outputs. We may filter or block unsafe content.</li>
            </ul>

            <h2>6. Plans, Billing, and Refunds</h2>
            <ul>
              <li>Paid plans grant usage limits/features described in the app. Taxes may be included in price where stated.</li>
              <li>Charges are processed by our payment processor. By subscribing you authorize recurring charges where applicable.</li>
              <li>Except where required by law, fees are non‑refundable once delivered.</li>
            </ul>

            <h2>7. Service Changes</h2>
            <p>
              We may modify or discontinue features. We will make reasonable efforts to notify you of material changes.
            </p>

            <h2>8. Disclaimers</h2>
            <p>
              Service is provided “as is” without warranties. To the extent permitted by law, we disclaim implied warranties
              of merchantability, fitness for a particular purpose, and non‑infringement.
            </p>

            <h2>9. Limitation of Liability</h2>
            <p>
              To the maximum extent permitted by law, LoveAI is not liable for indirect, incidental, special, or consequential damages.
              Our aggregate liability for claims relating to the service shall not exceed the amount you paid in the 3 months prior to the claim.
            </p>

            <h2>10. Termination</h2>
            <p>
              You may stop using the service at any time. We may suspend or terminate accounts that violate these Terms or present risk.
            </p>

            <h2>11. Governing Law</h2>
            <p>These Terms are governed by the laws of the jurisdiction of our principal place of business.</p>

            <h2>12. Contact</h2>
            <p>Questions? Contact support via the app.</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
