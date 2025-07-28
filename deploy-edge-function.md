# Deploy Supabase Edge Function for Email Invitations

## Prerequisites
1. Install Supabase CLI: `npm install -g supabase`
2. Login to Supabase: `supabase login`

## Steps to Deploy

### 1. Link your project
```bash
supabase link --project-ref fqayygyorwvgekebprco
```

### 2. Set the Resend API key as a secret
```bash
supabase secrets set RESEND_API_KEY=re_h3tvM9fC_C5JH12ELAP1mY5Y8P5tPqGic
```

### 3. Deploy the Edge Function
```bash
supabase functions deploy send-family-invite
```

### 4. Verify deployment
The function should be available at:
```
https://fqayygyorwvgekebprco.supabase.co/functions/v1/send-family-invite
```

## Alternative: Manual Setup in Supabase Dashboard

If CLI doesn't work, you can:

1. **Go to Supabase Dashboard** → **Edge Functions**
2. **Create new function** named `send-family-invite`
3. **Copy the code** from `supabase/functions/send-family-invite/index.ts`
4. **Set environment variable** `RESEND_API_KEY` = `re_h3tvM9fC_C5JH12ELAP1mY5Y8P5tPqGic`
5. **Deploy the function**

## Testing

After deployment, test the function by sending a family invitation from the app.

## Troubleshooting

- If you get authentication errors, make sure the user is signed in
- If you get CORS errors, check that the Edge Function is deployed correctly
- Check the Edge Function logs in Supabase Dashboard for detailed error messages
