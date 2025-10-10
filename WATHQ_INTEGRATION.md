# Wathq API Integration

## Overview
This document describes the integration with Wathq API for commercial registry verification in the NDA signing process.

## API Configuration

### Environment Variables
Add these environment variables to your `.env` file:

```bash
# Wathq API Configuration
WATHQ_API_URL=https://api.wathq.sa/sandbox/commercial-registration
WATHQ_API_KEY=your-wathq-api-key-here
```

### API Endpoint
- **Base URL**: `https://api.wathq.sa/sandbox/commercial-registration`
- **Endpoint**: `/fullinfo/{crNumber}`
- **Method**: GET
- **Authentication**: Bearer Token

## Features

### 1. Commercial Registry Verification
- Validates commercial registry number with Wathq API
- Checks if the company is active and registered
- Verifies company information accuracy

### 2. Company Name Matching
- Compares entered company name with registered name
- Normalizes company names for accurate comparison
- Provides feedback on name mismatches

### 3. Error Handling
- Handles API timeouts (10 seconds)
- Manages authentication failures
- Provides user-friendly error messages
- Graceful fallback when API is unavailable

## Usage

### In NDA Creation Process
```typescript
// The service is automatically called during NDA creation
const wathqVerification = await wathqService.verifyCommercialRegistry(crNumber);
```

### Manual Verification
```typescript
import { wathqService } from './wathqService';

// Verify commercial registry
const result = await wathqService.verifyCommercialRegistry('1010123456');

// Verify company name
const nameCheck = await wathqService.verifyCompanyName('1010123456', 'Company Name');
```

## Response Format

### Success Response
```typescript
{
  success: true,
  data: {
    crNumber: "1010123456",
    companyName: "شركة التقنية المتقدمة",
    companyNameEn: "Advanced Technology Company",
    status: "active",
    type: "شركة ذات مسؤولية محدودة",
    registrationDate: "2020-01-15",
    capital: "1000000",
    address: "الرياض، المملكة العربية السعودية",
    phone: "+966501234567",
    email: "info@company.com",
    website: "https://company.com",
    activities: ["تطوير البرمجيات", "الاستشارات التقنية"],
    partners: [...]
  }
}
```

### Error Response
```typescript
{
  success: false,
  error: "السجل التجاري غير موجود في قاعدة بيانات وثيق",
  message: "يرجى التحقق من صحة رقم السجل التجاري"
}
```

## Error Codes

| Error | Description | Action |
|-------|-------------|--------|
| 404 | Commercial registry not found | Check CR number |
| 401 | Authentication failed | Verify API key |
| 500 | Server error | Retry or contact support |
| Timeout | API timeout | Retry request |

## Security Considerations

1. **API Key Security**: Store Wathq API key securely in environment variables
2. **Rate Limiting**: Implement rate limiting to avoid API quota exhaustion
3. **Data Privacy**: Only store necessary company information
4. **Error Logging**: Log errors without exposing sensitive data

## Testing

### Test Commercial Registry Numbers
- Use sandbox environment for testing
- Test with valid and invalid CR numbers
- Verify error handling scenarios

### Test Scenarios
1. Valid commercial registry with matching company name
2. Valid commercial registry with mismatched company name
3. Invalid commercial registry number
4. API timeout scenarios
5. Authentication failure scenarios

## Monitoring

### Logs to Monitor
- API request/response times
- Error rates and types
- Authentication failures
- Timeout occurrences

### Metrics to Track
- Verification success rate
- Average response time
- Error frequency by type
- API quota usage

## Troubleshooting

### Common Issues

1. **API Key Invalid**
   - Check WATHQ_API_KEY environment variable
   - Verify key is correct and active

2. **Timeout Errors**
   - Check network connectivity
   - Verify Wathq API status
   - Consider increasing timeout duration

3. **Company Name Mismatch**
   - Check name normalization logic
   - Verify company name in database
   - Update company profile if needed

### Debug Mode
Enable debug logging by setting:
```bash
DEBUG=wathq:*
```

## Future Enhancements

1. **Caching**: Implement caching for verified companies
2. **Batch Verification**: Support multiple CR numbers at once
3. **Webhook Integration**: Real-time updates for company status changes
4. **Advanced Matching**: Fuzzy matching for company names
5. **Audit Trail**: Track all verification attempts
