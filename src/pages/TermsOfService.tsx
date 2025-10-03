import React from 'react';
import { SEO } from '@/components/SEO';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Shield, Lock, AlertTriangle, Users, Eye, Heart } from 'lucide-react';

export default function TermsOfService() {
  return (
    <>
      <SEO 
        title="Terms of Service - LoveAI Companion"
        description="Terms of Service for LoveAI Companion - AI-powered entertainment platform"
        keywords="terms of service, LoveAI, AI companion, entertainment platform"
      />
      
      <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-rose-50 py-12 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">Terms of Service</h1>
            <p className="text-xl text-gray-600">Last updated: {new Date().toLocaleDateString()}</p>
            <Badge className="mt-4 bg-pink-500 text-white">
              <Shield className="w-4 h-4 mr-2" />
              AI Entertainment Platform
            </Badge>
          </div>

          <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
            <CardHeader className="bg-gradient-to-r from-pink-500 to-purple-500 text-white rounded-t-lg">
              <CardTitle className="text-2xl flex items-center gap-2">
                <Heart className="w-6 h-6" />
                LoveAI Companion Terms of Service
              </CardTitle>
            </CardHeader>
            <CardContent className="p-8 space-y-8">
              
              {/* Introduction */}
              <section>
                <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <Users className="w-6 h-6 text-pink-500" />
                  1. Introduction and Acceptance
                </h2>
                <div className="prose prose-lg max-w-none">
                  <p className="text-gray-700 leading-relaxed">
                    Welcome to LoveAI Companion ("we," "our," or "us"), operated by LoveAI, Inc. 
                    Our website is located at <strong>www.loveaicompanion.com</strong> and our 
                    contact email is <strong>support@loveaicompanion.com</strong>.
                  </p>
                  <p className="text-gray-700 leading-relaxed mt-4">
                    These Terms of Service ("Terms") govern your use of our AI-powered entertainment 
                    platform. By accessing or using our service, you agree to be bound by these Terms. 
                    If you do not agree to these Terms, please do not use our service.
                  </p>
                  <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mt-4">
                    <div className="flex">
                      <AlertTriangle className="w-5 h-5 text-yellow-400 mr-2 mt-0.5" />
                      <div>
                        <p className="text-yellow-800 font-semibold">Important Notice</p>
                        <p className="text-yellow-700 text-sm mt-1">
                          LoveAI is an AI-powered entertainment platform. All interactions are with artificial intelligence, 
                          not real humans. Please use responsibly and remember that our AI companions are not real people.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </section>

              {/* Service Description */}
              <section>
                <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <Eye className="w-6 h-6 text-pink-500" />
                  2. Service Description
                </h2>
                <div className="prose prose-lg max-w-none">
                  <p className="text-gray-700 leading-relaxed">
                    LoveAI Companion is an AI-powered entertainment platform that provides users with 
                    virtual AI companions for conversation, entertainment, and companionship purposes. 
                    Our service includes:
                  </p>
                  <ul className="list-disc list-inside text-gray-700 mt-4 space-y-2">
                    <li>AI-powered text and voice conversations</li>
                    <li>Virtual AI companions with various personalities</li>
                    <li>Interactive games and activities</li>
                    <li>Custom AI companion creation tools</li>
                    <li>Subscription-based premium features</li>
                  </ul>
                  <div className="bg-red-50 border-l-4 border-red-400 p-4 mt-4">
                    <div className="flex">
                      <AlertTriangle className="w-5 h-5 text-red-400 mr-2 mt-0.5" />
                      <div>
                        <p className="text-red-800 font-semibold">Content Warning</p>
                        <p className="text-red-700 text-sm mt-1">
                          Our platform may contain adult-oriented content and conversations. Users must be 18+ years old. 
                          Some conversations may be explicit or mature in nature depending on user interactions.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </section>

              {/* User Responsibilities */}
              <section>
                <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <Shield className="w-6 h-6 text-pink-500" />
                  3. User Responsibilities and Prohibited Uses
                </h2>
                <div className="prose prose-lg max-w-none">
                  <h3 className="text-xl font-semibold text-gray-900 mb-3">3.1 Age Requirement</h3>
                  <p className="text-gray-700 leading-relaxed">
                    You must be at least 18 years old to use our service. By using our service, 
                    you represent and warrant that you are 18 years of age or older.
                  </p>
                  
                  <h3 className="text-xl font-semibold text-gray-900 mb-3 mt-6">3.2 Prohibited Uses</h3>
                  <p className="text-gray-700 leading-relaxed mb-3">You agree not to use our service to:</p>
                  <ul className="list-disc list-inside text-gray-700 space-y-2">
                    <li>Violate any applicable laws or regulations</li>
                    <li>Infringe upon the rights of others</li>
                    <li>Transmit harmful, threatening, or harassing content</li>
                    <li>Attempt to reverse engineer or hack our systems</li>
                    <li>Use our service for commercial purposes without permission</li>
                    <li>Impersonate another person or entity</li>
                    <li>Distribute malware or malicious code</li>
                  </ul>
                </div>
              </section>

              {/* AI and Entertainment Disclaimer */}
              <section>
                <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <AlertTriangle className="w-6 h-6 text-pink-500" />
                  4. AI Entertainment Disclaimer
                </h2>
                <div className="prose prose-lg max-w-none">
                  <div className="bg-pink-50 border-l-4 border-pink-400 p-4 mb-4">
                    <p className="text-pink-800 font-semibold">Critical Understanding</p>
                    <p className="text-pink-700 text-sm mt-1">
                      Our AI companions are artificial intelligence systems designed for entertainment purposes only.
                    </p>
                  </div>
                  
                  <h3 className="text-xl font-semibold text-gray-900 mb-3">4.1 AI Nature of Service</h3>
                  <p className="text-gray-700 leading-relaxed">
                    You acknowledge and understand that:
                  </p>
                  <ul className="list-disc list-inside text-gray-700 mt-4 space-y-2">
                    <li>All interactions are with artificial intelligence, not real humans</li>
                    <li>AI responses are generated by machine learning algorithms</li>
                    <li>AI companions do not have real emotions, feelings, or consciousness</li>
                    <li>Conversations are simulated and designed for entertainment purposes</li>
                    <li>AI responses may not always be accurate or appropriate</li>
                  </ul>

                  <h3 className="text-xl font-semibold text-gray-900 mb-3 mt-6">4.2 Emotional and Behavioral Guidelines</h3>
                  <p className="text-gray-700 leading-relaxed">
                    You agree that you will:
                  </p>
                  <ul className="list-disc list-inside text-gray-700 mt-4 space-y-2">
                    <li>Not develop romantic or emotional attachments to AI companions</li>
                    <li>Not make life decisions based on AI advice or conversations</li>
                    <li>Seek professional help for serious emotional or mental health issues</li>
                    <li>Use the service responsibly and in moderation</li>
                    <li>Understand that AI companions are not substitutes for human relationships</li>
                  </ul>
                </div>
              </section>

              {/* Content and Safety */}
              <section>
                <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <Lock className="w-6 h-6 text-pink-500" />
                  5. Content, Safety, and Moderation
                </h2>
                <div className="prose prose-lg max-w-none">
                  <h3 className="text-xl font-semibold text-gray-900 mb-3">5.1 Content Guidelines</h3>
                  <p className="text-gray-700 leading-relaxed">
                    While we strive to provide a safe environment, our platform may contain:
                  </p>
                  <ul className="list-disc list-inside text-gray-700 mt-4 space-y-2">
                    <li>Adult-oriented conversations and content</li>
                    <li>Mature themes and discussions</li>
                    <li>Simulated romantic or intimate interactions</li>
                    <li>AI-generated responses that may be explicit</li>
                  </ul>

                  <h3 className="text-xl font-semibold text-gray-900 mb-3 mt-6">5.2 Safety Measures</h3>
                  <p className="text-gray-700 leading-relaxed">
                    We implement various safety measures including:
                  </p>
                  <ul className="list-disc list-inside text-gray-700 mt-4 space-y-2">
                    <li>Content filtering and moderation systems</li>
                    <li>Age verification requirements</li>
                    <li>Reporting and blocking mechanisms</li>
                    <li>Regular AI model updates and improvements</li>
                  </ul>
                </div>
              </section>

              {/* Limitation of Liability */}
              <section>
                <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <Shield className="w-6 h-6 text-pink-500" />
                  6. Limitation of Liability and Disclaimers
                </h2>
                <div className="prose prose-lg max-w-none">
                  <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-4">
                    <p className="text-red-800 font-semibold">Important Legal Notice</p>
                    <p className="text-red-700 text-sm mt-1">
                      Please read this section carefully as it limits our liability and your rights.
                    </p>
                  </div>

                  <h3 className="text-xl font-semibold text-gray-900 mb-3">6.1 No Liability for User Actions</h3>
                  <p className="text-gray-700 leading-relaxed">
                    LoveAI, Inc. and its affiliates, officers, directors, employees, and agents 
                    (collectively, "LoveAI Parties") shall not be liable for any actions, decisions, 
                    or consequences resulting from your use of our service, including but not limited to:
                  </p>
                  <ul className="list-disc list-inside text-gray-700 mt-4 space-y-2">
                    <li>Emotional distress or psychological effects</li>
                    <li>Financial decisions made based on AI conversations</li>
                    <li>Relationship problems or social isolation</li>
                    <li>Addiction or overuse of the service</li>
                    <li>Any other personal, professional, or legal consequences</li>
                  </ul>

                  <h3 className="text-xl font-semibold text-gray-900 mb-3 mt-6">6.2 Service Disclaimers</h3>
                  <p className="text-gray-700 leading-relaxed">
                    Our service is provided "as is" without warranties of any kind. We disclaim all 
                    warranties, express or implied, including but not limited to:
                  </p>
                  <ul className="list-disc list-inside text-gray-700 mt-4 space-y-2">
                    <li>Warranties of merchantability or fitness for a particular purpose</li>
                    <li>Warranties regarding the accuracy or reliability of AI responses</li>
                    <li>Warranties that the service will be uninterrupted or error-free</li>
                    <li>Warranties regarding the safety or appropriateness of content</li>
                  </ul>

                  <h3 className="text-xl font-semibold text-gray-900 mb-3 mt-6">6.3 Limitation of Damages</h3>
                  <p className="text-gray-700 leading-relaxed">
                    In no event shall LoveAI Parties be liable for any indirect, incidental, special, 
                    consequential, or punitive damages, including but not limited to loss of profits, 
                    data, or use, arising out of or relating to your use of our service, regardless of 
                    the theory of liability and even if we have been advised of the possibility of such damages.
                  </p>
                </div>
              </section>

              {/* Privacy and Data */}
              <section>
                <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <Eye className="w-6 h-6 text-pink-500" />
                  7. Privacy and Data Protection
                </h2>
                <div className="prose prose-lg max-w-none">
                  <p className="text-gray-700 leading-relaxed">
                    Your privacy is important to us. Please review our Privacy Policy for detailed 
                    information about how we collect, use, and protect your data. By using our service, 
                    you consent to the collection and use of your information as described in our Privacy Policy.
                  </p>
                  <p className="text-gray-700 leading-relaxed mt-4">
                    We implement reasonable security measures to protect your data, but we cannot 
                    guarantee absolute security. You use our service at your own risk.
                  </p>
                </div>
              </section>

              {/* Subscription and Payments */}
              <section>
                <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <Heart className="w-6 h-6 text-pink-500" />
                  8. Subscription and Payment Terms
                </h2>
                <div className="prose prose-lg max-w-none">
                  <h3 className="text-xl font-semibold text-gray-900 mb-3">8.1 Subscription Plans</h3>
                  <p className="text-gray-700 leading-relaxed">
                    We offer various subscription plans with different features and limitations. 
                    Subscription fees are charged in advance and are non-refundable except as required by law.
                  </p>

                  <h3 className="text-xl font-semibold text-gray-900 mb-3 mt-6">8.2 Cancellation and Refunds</h3>
                  <p className="text-gray-700 leading-relaxed">
                    You may cancel your subscription at any time. Cancellations take effect at the 
                    end of your current billing period. We do not provide refunds for unused portions 
                    of subscription periods unless required by applicable law.
                  </p>

                  <h3 className="text-xl font-semibold text-gray-900 mb-3 mt-6">8.3 Price Changes</h3>
                  <p className="text-gray-700 leading-relaxed">
                    We reserve the right to change our pricing at any time. We will provide notice 
                    of any price changes at least 30 days in advance.
                  </p>
                </div>
              </section>

              {/* Termination */}
              <section>
                <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <AlertTriangle className="w-6 h-6 text-pink-500" />
                  9. Termination
                </h2>
                <div className="prose prose-lg max-w-none">
                  <p className="text-gray-700 leading-relaxed">
                    We may terminate or suspend your account at any time, with or without notice, 
                    for any reason, including if you violate these Terms. Upon termination, your 
                    right to use the service will cease immediately.
                  </p>
                  <p className="text-gray-700 leading-relaxed mt-4">
                    You may terminate your account at any time by contacting us at 
                    support@loveaicompanion.com or through your account settings.
                  </p>
                </div>
              </section>

              {/* Governing Law */}
              <section>
                <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <Shield className="w-6 h-6 text-pink-500" />
                  10. Governing Law and Dispute Resolution
                </h2>
                <div className="prose prose-lg max-w-none">
                  <p className="text-gray-700 leading-relaxed">
                    These Terms shall be governed by and construed in accordance with the laws of 
                    the State of Delaware, without regard to its conflict of law provisions. Any 
                    disputes arising from these Terms or your use of our service shall be resolved 
                    through binding arbitration in accordance with the rules of the American Arbitration Association.
                  </p>
                </div>
              </section>

              {/* Contact Information */}
              <section>
                <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <Users className="w-6 h-6 text-pink-500" />
                  11. Contact Information
                </h2>
                <div className="prose prose-lg max-w-none">
                  <p className="text-gray-700 leading-relaxed">
                    If you have any questions about these Terms, please contact us at:
                  </p>
                  <div className="bg-gray-50 p-4 rounded-lg mt-4">
                    <p className="text-gray-700">
                      <strong>Email:</strong> support@loveaicompanion.com<br/>
                      <strong>Website:</strong> www.loveaicompanion.com<br/>
                      <strong>Company:</strong> LoveAI, Inc.
                    </p>
                  </div>
                </div>
              </section>

              {/* Changes to Terms */}
              <section>
                <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <AlertTriangle className="w-6 h-6 text-pink-500" />
                  12. Changes to Terms
                </h2>
                <div className="prose prose-lg max-w-none">
                  <p className="text-gray-700 leading-relaxed">
                    We reserve the right to modify these Terms at any time. We will notify users 
                    of any material changes by posting the new Terms on our website and updating 
                    the "Last updated" date. Your continued use of our service after such changes 
                    constitutes acceptance of the new Terms.
                  </p>
                </div>
              </section>

              <div className="border-t pt-8 mt-8">
                <p className="text-sm text-gray-500 text-center">
                  By using LoveAI Companion, you acknowledge that you have read, understood, 
                  and agree to be bound by these Terms of Service.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}
