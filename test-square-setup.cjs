// Test Square API credentials
const fetch = require('node-fetch');

async function testSquareCredentials() {
  const accessToken = process.env.SQUARE_ACCESS_TOKEN;
  const locationId = process.env.SQUARE_LOCATION_ID;
  const environment = process.env.SQUARE_ENVIRONMENT;
  
  console.log('🔧 Testing Square credentials...');
  console.log('Environment:', environment);
  console.log('Location ID:', locationId);
  console.log('Access Token (first 10 chars):', accessToken?.substring(0, 10) + '...');
  
  const apiUrl = environment === 'production' 
    ? 'https://connect.squareup.com/v2' 
    : 'https://connect.squareupsandbox.com/v2';
  
  try {
    // Test locations endpoint
    const response = await fetch(`${apiUrl}/locations`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Square-Version': '2023-10-18'
      }
    });
    
    const result = await response.json();
    
    if (response.ok) {
      console.log('✅ Square API connection successful!');
      console.log('Available locations:', result.locations?.length || 0);
      if (result.locations?.[0]) {
        console.log('First location ID:', result.locations[0].id);
        console.log('Location name:', result.locations[0].name);
      }
    } else {
      console.log('❌ Square API error:', result);
    }
  } catch (error) {
    console.log('❌ Connection error:', error.message);
  }
}

testSquareCredentials();
