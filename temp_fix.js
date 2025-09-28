// Read the current file
const fs = require('fs');
let content = fs.readFileSync('src/components/UnifiedSignupFlow.tsx', 'utf8');

// Fix the payment success check
content = content.replace(
  /if \(subscriptionResult\.success\) \{[\s\S]*?\} else \{[\s\S]*?\}/,
  `if (subscriptionResult && subscriptionResult.id) {
        // Payment successful - create account with paid plan
        await createAccount(selectedPlan);

        toast({
          title: "Payment Successful! 🎉",
          description: \`Welcome to LoveAI \${selectedPlanDetails.name}! Your account is ready.\`,
        });

        navigate('/app', { replace: true, state: { startChatDefault: true } });
        return;
      } else {
        console.error('Payment failed:', subscriptionResult);
        toast({
          title: "Payment Failed",
          description: "Payment could not be processed. Please try again.",
          variant: "destructive"
        });
      }`
);

// Write back
fs.writeFileSync('src/components/UnifiedSignupFlow.tsx', content);
console.log('Fixed payment success check');
