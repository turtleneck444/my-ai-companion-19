// Add billing address fields after the age field
const fs = require('fs');
let content = fs.readFileSync('src/components/UnifiedSignupFlow.tsx', 'utf8');

// Add billing address fields after the age field
const billingFields = `        </div>

        {/* Billing Address */}
        <div className="space-y-4">
          <h4 className="text-md font-medium">Billing Address</h4>
          
          {/* Address Line 1 */}
          <div className="space-y-2">
            <Label htmlFor="addressLine1">Address Line 1 *</Label>
            <Input
              id="addressLine1"
              type="text"
              value={formData.addressLine1 || ''}
              onChange={(e) => handleInputChange('addressLine1', e.target.value)}
              placeholder="123 Main Street"
              autoComplete="address-line1"
              required
            />
          </div>

          {/* Address Line 2 */}
          <div className="space-y-2">
            <Label htmlFor="addressLine2">Address Line 2</Label>
            <Input
              id="addressLine2"
              type="text"
              value={formData.addressLine2 || ''}
              onChange={(e) => handleInputChange('addressLine2', e.target.value)}
              placeholder="Apartment, suite, etc. (optional)"
              autoComplete="address-line2"
            />
          </div>

          {/* City and State */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="city">City *</Label>
              <Input
                id="city"
                type="text"
                value={formData.city || ''}
                onChange={(e) => handleInputChange('city', e.target.value)}
                placeholder="New York"
                autoComplete="address-level2"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="state">State *</Label>
              <Input
                id="state"
                type="text"
                value={formData.state || ''}
                onChange={(e) => handleInputChange('state', e.target.value)}
                placeholder="NY"
                autoComplete="address-level1"
                required
              />
            </div>
          </div>

          {/* ZIP Code and Country */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="postalCode">ZIP Code *</Label>
              <Input
                id="postalCode"
                type="text"
                value={formData.postalCode || ''}
                onChange={(e) => handleInputChange('postalCode', e.target.value)}
                placeholder="10001"
                autoComplete="postal-code"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="country">Country *</Label>
              <Input
                id="country"
                type="text"
                value={formData.country || 'US'}
                onChange={(e) => handleInputChange('country', e.target.value)}
                placeholder="US"
                autoComplete="country"
                required
              />
            </div>
          </div>
        </div>`;

// Replace the closing div after age field
content = content.replace(
  /          <p className="text-sm text-muted-foreground">Must be 18 or older<\/p>\n        <\/div>\n      <\/div>/,
  `          <p className="text-sm text-muted-foreground">Must be 18 or older</p>
        </div>
        ${billingFields}
      </div>`
);

// Write back
fs.writeFileSync('src/components/UnifiedSignupFlow.tsx', content);
console.log('Added billing address fields');
