import { supabase } from "@/integrations/supabase/client";
import type { Provider } from "@supabase/supabase-js";

export interface AuthError {
  message: string;
  provider?: string;
}

export interface AuthResult {
  success: boolean;
  error?: AuthError;
  user?: any;
}

class AuthService {
  /**
   * Handle OAuth sign in with enhanced error handling and logging
   */
  async signInWithOAuth(provider: Provider, redirectTo?: string): Promise<AuthResult> {
    try {
      console.log(`Initiating OAuth sign in with ${provider}`);
      
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: redirectTo || `${window.location.origin}/dashboard`,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          }
        }
      });

      if (error) {
        console.error(`OAuth error for ${provider}:`, error);
        return {
          success: false,
          error: {
            message: this.getProviderErrorMessage(provider, error.message),
            provider
          }
        };
      }

      console.log(`OAuth initiated successfully for ${provider}`);
      return { success: true };

    } catch (err) {
      console.error(`OAuth catch error for ${provider}:`, err);
      return {
        success: false,
        error: {
          message: `Unexpected error during ${provider} authentication`,
          provider
        }
      };
    }
  }

  /**
   * Handle email/password sign up
   */
  async signUpWithEmail(email: string, password: string, fullName: string): Promise<AuthResult> {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/signin`,
          data: {
            full_name: fullName
          }
        }
      });

      if (error) {
        return {
          success: false,
          error: { message: error.message }
        };
      }

      return {
        success: true,
        user: data.user
      };

    } catch (err) {
      return {
        success: false,
        error: { message: "Unexpected error during sign up" }
      };
    }
  }

  /**
   * Handle email/password sign in
   */
  async signInWithEmail(email: string, password: string): Promise<AuthResult> {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) {
        return {
          success: false,
          error: { message: this.getEmailErrorMessage(error.message) }
        };
      }

      return {
        success: true,
        user: data.user
      };

    } catch (err) {
      return {
        success: false,
        error: { message: "Unexpected error during sign in" }
      };
    }
  }

  /**
   * Handle password reset
   */
  async resetPassword(email: string): Promise<AuthResult> {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/signin`
      });

      if (error) {
        return {
          success: false,
          error: { message: error.message }
        };
      }

      return { success: true };

    } catch (err) {
      return {
        success: false,
        error: { message: "Unexpected error during password reset" }
      };
    }
  }

  /**
   * Sign out user
   */
  async signOut(): Promise<AuthResult> {
    try {
      const { error } = await supabase.auth.signOut();

      if (error) {
        return {
          success: false,
          error: { message: error.message }
        };
      }

      return { success: true };

    } catch (err) {
      return {
        success: false,
        error: { message: "Unexpected error during sign out" }
      };
    }
  }

  /**
   * Get current user session
   */
  async getCurrentSession() {
    try {
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error) {
        console.error('Error getting session:', error);
        return null;
      }

      return session;
    } catch (err) {
      console.error('Unexpected error getting session:', err);
      return null;
    }
  }

  /**
   * Get current user
   */
  async getCurrentUser() {
    try {
      const { data: { user }, error } = await supabase.auth.getUser();
      
      if (error) {
        console.error('Error getting user:', error);
        return null;
      }

      return user;
    } catch (err) {
      console.error('Unexpected error getting user:', err);
      return null;
    }
  }

  /**
   * Listen to auth state changes
   */
  onAuthStateChange(callback: (event: string, session: any) => void) {
    return supabase.auth.onAuthStateChange(callback);
  }

  /**
   * Get provider-specific error messages
   */
  private getProviderErrorMessage(provider: string, originalMessage: string): string {
    const providerMessages: Record<string, Record<string, string>> = {
      google: {
        'popup_closed_by_user': 'Google sign-in was cancelled. Please try again.',
        'access_denied': 'Google access was denied. Please check your Google account permissions.',
        'invalid_request': 'Invalid Google sign-in request. Please try again.',
        'default': 'Error signing in with Google. Please try again.'
      },
      facebook: {
        'popup_closed_by_user': 'Facebook sign-in was cancelled. Please try again.',
        'access_denied': 'Facebook access was denied. Please check your Facebook account permissions.',
        'invalid_request': 'Invalid Facebook sign-in request. Please try again.',
        'default': 'Error signing in with Facebook. Please try again.'
      },
      twitter: {
        'popup_closed_by_user': 'X (Twitter) sign-in was cancelled. Please try again.',
        'access_denied': 'X (Twitter) access was denied. Please check your account permissions.',
        'invalid_request': 'Invalid X (Twitter) sign-in request. Please try again.',
        'default': 'Error signing in with X (Twitter). Please try again.'
      },
      apple: {
        'popup_closed_by_user': 'Apple sign-in was cancelled. Please try again.',
        'access_denied': 'Apple access was denied. Please check your Apple ID permissions.',
        'invalid_request': 'Invalid Apple sign-in request. Please try again.',
        'default': 'Error signing in with Apple. Please try again.'
      }
    };

    const providerName = provider.toLowerCase();
    const messages = providerMessages[providerName];
    
    if (!messages) {
      return `Error signing in with ${provider}. Please try again.`;
    }

    // Check for specific error patterns
    for (const [pattern, message] of Object.entries(messages)) {
      if (pattern !== 'default' && originalMessage.toLowerCase().includes(pattern)) {
        return message;
      }
    }

    return messages.default;
  }

  /**
   * Get email-specific error messages
   */
  private getEmailErrorMessage(originalMessage: string): string {
    const errorMessages: Record<string, string> = {
      'invalid_credentials': 'Invalid email or password. Please check your credentials and try again.',
      'email_not_confirmed': 'Please check your email and confirm your account before signing in.',
      'too_many_requests': 'Too many sign-in attempts. Please wait a moment and try again.',
      'weak_password': 'Password is too weak. Please choose a stronger password.',
      'signup_disabled': 'New user registration is currently disabled.',
      'email_address_invalid': 'Please enter a valid email address.',
      'password_too_short': 'Password must be at least 6 characters long.'
    };

    const lowerMessage = originalMessage.toLowerCase();
    
    for (const [pattern, message] of Object.entries(errorMessages)) {
      if (lowerMessage.includes(pattern.replace('_', ' ')) || lowerMessage.includes(pattern)) {
        return message;
      }
    }

    return originalMessage;
  }
}

export const authService = new AuthService();