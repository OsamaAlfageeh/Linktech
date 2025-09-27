# Moyasar Payment Integration Troubleshooting Guide

## Issue Description
The Moyasar payment integration works locally but fails in production with error:
```
فشل في إنشاء فاتورة الدفع (Failed to create payment invoice)
```

## Common Causes & Solutions

### 1. Environment Variables Not Set
**Problem**: `MOYASAR_SECRET_KEY` or `FRONTEND_URL` not configured in production.

**Solution**:
```bash
# Check if environment variables are set
MOYASAR_SECRET_KEY=sk_live_your_actual_key_here
FRONTEND_URL=https://yourdomain.com
```

**Debug**: Visit `/api/debug/moyasar-config` to check configuration.

### 2. API Key Issues
**Problem**: Wrong API key format or expired key.

**Common Issues**:
- Using test key (`sk_test_`) in production
- Using live key (`sk_live_`) in development
- Key has expired or been revoked
- Key doesn't have invoice creation permissions

**Solution**:
- Verify key format: `sk_live_` for production, `sk_test_` for development
- Check Moyasar dashboard for key status
- Ensure key has proper permissions

### 3. Network/Firewall Issues
**Problem**: Production server cannot reach Moyasar API.

**Debug Steps**:
```bash
# Test connectivity from production server
curl -I https://api.moyasar.com/v1/invoices
```

**Solution**:
- Check firewall rules
- Ensure HTTPS outbound connections are allowed
- Verify DNS resolution

### 4. URL Configuration Issues
**Problem**: Invalid callback URLs or frontend URL.

**Common Issues**:
- `FRONTEND_URL` not set or incorrect
- Callback URLs using HTTP instead of HTTPS
- URLs pointing to localhost in production

**Solution**:
```bash
FRONTEND_URL=https://yourdomain.com  # Not http://localhost:3000
```

### 5. Amount Validation Issues
**Problem**: Invalid payment amounts.

**Common Issues**:
- Amount is 0 or negative
- Amount is not a valid number
- Amount exceeds Moyasar limits

**Solution**:
- Validate amount before API call
- Ensure amount is in SAR (Saudi Riyal)
- Check Moyasar transaction limits

## Debugging Steps

### Step 1: Check Configuration
Visit: `https://yourdomain.com/api/debug/moyasar-config`

Expected response:
```json
{
  "moyasarKeyExists": true,
  "moyasarKeyLength": 32,
  "moyasarKeyPrefix": "sk_live_",
  "frontendUrl": "https://yourdomain.com",
  "nodeEnv": "production"
}
```

### Step 2: Check Server Logs
Look for these debug messages in production logs:
```
🔍 Payment Route Debug:
🔍 Moyasar Invoice Creation Debug:
❌ Moyasar invoice creation error:
```

### Step 3: Test API Key Manually
```bash
# Test Moyasar API key manually
curl -X POST https://api.moyasar.com/v1/invoices \
  -H "Authorization: Basic $(echo -n 'sk_live_your_key:' | base64)" \
  -H "Content-Type: application/json" \
  -d '{
    "amount": 100,
    "currency": "SAR",
    "description": "Test invoice"
  }'
```

## Production Checklist

- [ ] `MOYASAR_SECRET_KEY` is set with live key (`sk_live_`)
- [ ] `FRONTEND_URL` is set to production domain
- [ ] HTTPS is enabled for all URLs
- [ ] Server can reach `api.moyasar.com`
- [ ] Moyasar account is active and has proper permissions
- [ ] Payment amounts are valid (positive numbers)
- [ ] Debug endpoint shows correct configuration

## Quick Fixes

### Fix 1: Environment Variables
```bash
# Add to production environment
MOYASAR_SECRET_KEY=sk_live_your_actual_key
FRONTEND_URL=https://yourdomain.com
NODE_ENV=production
```

### Fix 2: URL Validation
Ensure all URLs use HTTPS in production:
```javascript
// In production, ensure URLs start with https://
const frontendUrl = process.env.FRONTEND_URL || 'https://yourdomain.com';
```

### Fix 3: Error Handling
The improved error handling will now show specific error messages:
- "Moyasar API key is invalid or expired" (401)
- "Moyasar validation error: [specific error]" (400)
- "Moyasar API access forbidden" (403)
- "Cannot connect to Moyasar API" (network issues)

## Testing in Production

1. **Check Configuration**: Visit `/api/debug/moyasar-config`
2. **Test Payment**: Try creating a payment with a small amount
3. **Monitor Logs**: Check server logs for detailed error messages
4. **Verify URLs**: Ensure all callback URLs are accessible

## Contact Support

If issues persist:
1. Check Moyasar dashboard for account status
2. Contact Moyasar support with error logs
3. Verify account permissions and limits
4. Check if account is in good standing
