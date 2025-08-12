# OAuth Providers Setup Guide

This guide will help you configure all OAuth providers (Google, Facebook, X/Twitter, and Apple) in your Supabase project to enable social authentication.

## Prerequisites

1. Access to your Supabase project dashboard
2. Developer accounts for each OAuth provider you want to enable
3. Your application's domain and redirect URLs

## Supabase Configuration

### 1. Access Authentication Settings

1. Go to your Supabase project dashboard
2. Navigate to **Authentication** → **Providers**
3. You'll see a list of available OAuth providers

### 2. Configure Site URL and Redirect URLs

Before configuring individual providers, set up your site URLs:

1. Go to **Authentication** → **URL Configuration**
2. Set **Site URL**: `https://yourdomain.com` (or `http://localhost:3000` for development)
3. Add **Redirect URLs**:
   - `https://yourdomain.com/auth/callback`
   - `http://localhost:3000/auth/callback` (for development)

## Provider-Specific Setup

### Google OAuth Setup

#### 1. Create Google OAuth Application

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the **Google+ API** and **Google Identity API**
4. Go to **Credentials** → **Create Credentials** → **OAuth 2.0 Client IDs**
5. Choose **Web application**
6. Add authorized redirect URIs:
   - `https://fqayygyorwvgekebprco.supabase.co/auth/v1/callback`
   - Add your custom domain if you have one

#### 2. Configure in Supabase

1. In Supabase, go to **Authentication** → **Providers**
2. Find **Google** and click **Enable**
3. Enter your **Client ID** and **Client Secret** from Google Cloud Console
4. Save the configuration

### Facebook OAuth Setup

#### 1. Create Facebook App

1. Go to [Facebook Developers](https://developers.facebook.com/)
2. Create a new app → **Consumer** type
3. Add **Facebook Login** product
4. In **Facebook Login** settings, add Valid OAuth Redirect URIs:
   - `https://fqayygyorwvgekebprco.supabase.co/auth/v1/callback`

#### 2. Configure in Supabase

1. In Supabase, find **Facebook** provider and click **Enable**
2. Enter your **App ID** and **App Secret** from Facebook
3. Save the configuration

### X (Twitter) OAuth Setup

#### 1. Create Twitter App

1. Go to [Twitter Developer Portal](https://developer.twitter.com/)
2. Create a new project and app
3. In app settings, enable **OAuth 2.0**
4. Add callback URLs:
   - `https://fqayygyorwvgekebprco.supabase.co/auth/v1/callback`
5. Set app permissions to **Read** (minimum required)

#### 2. Configure in Supabase

1. In Supabase, find **Twitter** provider and click **Enable**
2. Enter your **Client ID** and **Client Secret** from Twitter
3. Save the configuration

### Apple OAuth Setup

#### 1. Create Apple App

1. Go to [Apple Developer Portal](https://developer.apple.com/)
2. Go to **Certificates, Identifiers & Profiles**
3. Create a new **App ID** or use existing one
4. Enable **Sign In with Apple** capability
5. Create a **Services ID** for web authentication
6. Configure the Services ID with your domain and redirect URL:
   - `https://fqayygyorwvgekebprco.supabase.co/auth/v1/callback`

#### 2. Create Private Key

1. In Apple Developer Portal, go to **Keys**
2. Create a new key with **Sign In with Apple** enabled
3. Download the `.p8` private key file
4. Note the **Key ID** and **Team ID**

#### 3. Configure in Supabase

1. In Supabase, find **Apple** provider and click **Enable**
2. Enter:
   - **Client ID**: Your Services ID
   - **Client Secret**: Generate using your private key (see Apple documentation)
   - **Team ID**: Your Apple Developer Team ID
   - **Key ID**: Your private key ID
3. Save the configuration

## Testing OAuth Integration

### 1. Development Testing

1. Start your development server: `npm run dev`
2. Navigate to `/signup` or `/signin`
3. Click on any social login button
4. You should be redirected to the provider's authentication page
5. After successful authentication, you'll be redirected to `/auth/callback`
6. The callback handler will process the authentication and redirect to `/dashboard`

### 2. Production Testing

1. Deploy your application
2. Update OAuth provider settings with production URLs
3. Test each provider thoroughly

## Troubleshooting

### Common Issues

1. **"Invalid redirect URI"**
   - Ensure redirect URIs match exactly in both provider and Supabase settings
   - Check for trailing slashes and protocol (http vs https)

2. **"OAuth provider not configured"**
   - Verify the provider is enabled in Supabase
   - Check that Client ID and Client Secret are correctly entered

3. **"Popup blocked"**
   - Some browsers block OAuth popups
   - The current implementation uses redirects instead of popups

4. **"Access denied"**
   - User cancelled the OAuth flow
   - Check provider-specific permissions and scopes

### Debug Steps

1. Check browser console for errors
2. Verify Supabase logs in the dashboard
3. Test with different browsers and devices
4. Ensure all URLs use HTTPS in production

## Security Considerations

1. **Never expose client secrets** in frontend code
2. **Use HTTPS** for all production URLs
3. **Regularly rotate** OAuth credentials
4. **Monitor** authentication logs for suspicious activity
5. **Implement rate limiting** for authentication attempts

## Additional Features

### Enhanced User Experience

The implementation includes:

- **Loading states** during OAuth flow
- **Error handling** with user-friendly messages
- **Multilingual support** (English/Hindi)
- **Responsive design** for mobile devices
- **Accessibility features** for screen readers

### Error Recovery

- **Retry mechanisms** for failed authentications
- **Fallback options** when OAuth fails
- **Clear error messages** for different failure scenarios
- **Support links** for additional help

## Maintenance

### Regular Tasks

1. **Monitor OAuth provider changes** and update accordingly
2. **Review authentication logs** for issues
3. **Update redirect URLs** when deploying to new domains
4. **Test all providers** after any configuration changes
5. **Keep OAuth credentials secure** and rotate periodically

This setup ensures a robust, secure, and user-friendly social authentication system for your application.