# Deploy Email API to Vercel

## Quick Deployment Steps

### 1. Install Vercel CLI
```bash
npm install -g vercel
```

### 2. Login to Vercel
```bash
vercel login
```

### 3. Create a new directory for the API
```bash
mkdir nourishplate-email-api
cd nourishplate-email-api
```

### 4. Copy the files
Copy these files to the new directory:
- `api/send-family-invite.js`
- `vercel.json`
- `package-vercel.json` (rename to `package.json`)

### 5. Deploy to Vercel
```bash
vercel --prod
```

### 6. Set Environment Variable (Optional)
If you want to keep the API key secure:
```bash
vercel env add RESEND_API_KEY
# Enter: re_h3tvM9fC_C5JH12ELAP1mY5Y8P5tPqGic
```

### 7. Update Frontend
After deployment, update the API endpoint in `src/api/resend-email.ts`:
```javascript
const API_ENDPOINT = 'https://your-actual-vercel-url.vercel.app/api/send-family-invite';
```

## Alternative: GitHub Integration

### 1. Create GitHub Repository
1. Create a new repository on GitHub
2. Upload the API files:
   - `api/send-family-invite.js`
   - `vercel.json`
   - `package.json` (renamed from package-vercel.json)

### 2. Connect to Vercel
1. Go to [vercel.com](https://vercel.com)
2. Click "New Project"
3. Import your GitHub repository
4. Deploy automatically

### 3. Set Environment Variables
In Vercel dashboard:
1. Go to your project settings
2. Add environment variable:
   - Name: `RESEND_API_KEY`
   - Value: `re_h3tvM9fC_C5JH12ELAP1mY5Y8P5tPqGic`

## Testing

After deployment, test the API:
```bash
curl -X POST https://your-vercel-url.vercel.app/api/send-family-invite \
  -H "Content-Type: application/json" \
  -d '{
    "inviterName": "Test User",
    "inviterEmail": "test@example.com",
    "familyName": "Test Family",
    "inviteEmail": "invite@example.com",
    "role": "member",
    "inviteLink": "https://example.com/invite"
  }'
```

## Expected Response
```json
{
  "success": true,
  "messageId": "resend-message-id",
  "message": "Email sent successfully"
}
```

## Troubleshooting

- **CORS errors**: The API includes CORS headers for all origins
- **API key errors**: Make sure the environment variable is set correctly
- **Email not sending**: Check Vercel function logs in the dashboard
- **Timeout errors**: The function has a 30-second timeout limit

## Security Notes

- The API key is included in `vercel.json` for quick setup
- For production, use environment variables instead
- The API accepts requests from any origin (you can restrict this if needed)
