# Gemini API Query Parameter Fix

## Issue Identified
The Gemini API was returning a 400 error with the message:
```
"Invalid JSON payload received. Unknown name \"cacheBust\": Cannot bind query parameter. Field 'cacheBust' could not be found in request message."
```

## Root Cause
The Gemini API does not accept custom query parameters. I had added `?cacheBust=${Date.now()}` to the URL for cache-busting, but the API rejected this.

## Fix Applied
Removed the custom query parameter from the API URL:

### Before (Causing Error):
```typescript
const apiUrl = `${API_CONFIG.GEMINI_API_URL}/${API_CONFIG.GEMINI_MODEL}:generateContent?cacheBust=${Date.now()}`;
```

### After (Fixed):
```typescript
const apiUrl = `${API_CONFIG.GEMINI_API_URL}/${API_CONFIG.GEMINI_MODEL}:generateContent`;
```

## Uniqueness Still Maintained
Even without the query parameter, uniqueness is still ensured through:

1. **Unique Session ID in Prompt**: `UNIQUE REQUEST ID: ${sessionId}`
2. **Timestamp in Prompt**: `GENERATION TIMESTAMP: ${timestamp}`
3. **Random Elements**: Different focus areas and seasonal notes
4. **High Temperature**: 0.9 temperature with topP and topK for randomness
5. **Creative Requirements**: Explicit instructions for unique content

## Expected Result
- ✅ API requests should now work without 400 errors
- ✅ Uniqueness is still maintained through prompt content
- ✅ Each generation will still produce different results
- ✅ Network connectivity test will pass

The API should now work correctly while still generating unique, varied diet plans for each request.