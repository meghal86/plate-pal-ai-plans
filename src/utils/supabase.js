// Supabase Configuration and Utility Functions
// This file contains all Supabase-related functions for authentication and database operations

// Import the main Supabase client to avoid duplicate instances
import { supabase } from '@/integrations/supabase/client'

// ============================================================================
// AUTHENTICATION FUNCTIONS
// ============================================================================

/**
 * Sign up a new user with email and password
 * @param {string} email - User's email address
 * @param {string} password - User's password (min 6 characters)
 * @returns {Promise<{data, error}>} - Supabase auth response
 */
export const signUpUser = async (email, password) => {
  try {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    })
    return { data, error }
  } catch (error) {
    console.error('Error in signUpUser:', error)
    return { data: null, error }
  }
}

/**
 * Sign in user with email and password
 * @param {string} email - User's email address
 * @param {string} password - User's password
 * @returns {Promise<{data, error}>} - Supabase auth response
 */
export const signInUser = async (email, password) => {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    return { data, error }
  } catch (error) {
    console.error('Error in signInUser:', error)
    return { data: null, error }
  }
}

/**
 * Sign in user with OAuth provider (Google, Facebook, Twitter, Apple)
 * @param {string} provider - OAuth provider name
 * @param {string} redirectTo - URL to redirect after successful auth
 * @returns {Promise<{data, error}>} - Supabase auth response
 */
export const signInWithOAuth = async (provider, redirectTo = null) => {
  try {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: redirectTo || `${window.location.origin}/profile`,
      },
    })
    return { data, error }
  } catch (error) {
    console.error('Error in signInWithOAuth:', error)
    return { data: null, error }
  }
}

/**
 * Sign out current user
 * @returns {Promise<{error}>} - Supabase auth response
 */
export const signOutUser = async () => {
  try {
    const { error } = await supabase.auth.signOut()
    return { error }
  } catch (error) {
    console.error('Error in signOutUser:', error)
    return { error }
  }
}

/**
 * Get current authenticated user
 * @returns {Promise<{data, error}>} - Current user data
 */
export const getCurrentUser = async () => {
  try {
    const { data: { user }, error } = await supabase.auth.getUser()
    return { data: user, error }
  } catch (error) {
    console.error('Error in getCurrentUser:', error)
    return { data: null, error }
  }
}

/**
 * Listen to authentication state changes
 * @param {Function} callback - Function to call when auth state changes
 * @returns {Function} - Unsubscribe function
 */
export const onAuthStateChange = (callback) => {
  return supabase.auth.onAuthStateChange(callback)
}

/**
 * Resend email confirmation
 * @param {string} email - User's email address
 * @returns {Promise<{data, error}>} - Supabase auth response
 */
export const resendEmailConfirmation = async (email) => {
  try {
    const { data, error } = await supabase.auth.resend({
      type: 'signup',
      email: email,
      options: {
        emailRedirectTo: `${window.location.origin}/signin`
      }
    })
    return { data, error }
  } catch (error) {
    console.error('Error in resendEmailConfirmation:', error)
    return { data: null, error }
  }
}

/**
 * Check if user's email is confirmed
 * @param {string} email - User's email address
 * @returns {Promise<{data, error}>} - Email confirmation status
 */
export const checkEmailConfirmation = async (email) => {
  try {
    const { data, error } = await supabase.auth.admin.getUserByEmail(email)
    return { data, error }
  } catch (error) {
    console.error('Error in checkEmailConfirmation:', error)
    return { data: null, error }
  }
}

// ============================================================================
// USER PROFILE FUNCTIONS
// ============================================================================

/**
 * Create or update user profile
 * @param {Object} profileData - User profile data
 * @returns {Promise<{data, error}>} - Database response
 */
export const upsertUserProfile = async (profileData) => {
  try {
    const { data, error } = await supabase
      .from('user_profiles')
      .upsert(profileData, {
        onConflict: 'user_id'
      })
    return { data, error }
  } catch (error) {
    console.error('Error in upsertUserProfile:', error)
    return { data: null, error }
  }
}

/**
 * Get user profile by user ID
 * @param {string} userId - User's unique ID
 * @returns {Promise<{data, error}>} - User profile data
 */
export const getUserProfile = async (userId) => {
  try {
    const { data, error } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('user_id', userId)
      .single()
    return { data, error }
  } catch (error) {
    console.error('Error in getUserProfile:', error)
    return { data: null, error }
  }
}

/**
 * Update user profile
 * @param {string} userId - User's unique ID
 * @param {Object} updates - Profile fields to update
 * @returns {Promise<{data, error}>} - Database response
 */
export const updateUserProfile = async (userId, updates) => {
  try {
    const { data, error } = await supabase
      .from('user_profiles')
      .update(updates)
      .eq('user_id', userId)
    return { data, error }
  } catch (error) {
    console.error('Error in updateUserProfile:', error)
    return { data: null, error }
  }
}

// ============================================================================
// DIET PLANS FUNCTIONS
// ============================================================================

/**
 * Create a new diet plan
 * @param {Object} planData - Diet plan data
 * @returns {Promise<{data, error}>} - Database response
 */
export const createDietPlan = async (planData) => {
  try {
    const { data, error } = await supabase
      .from('nutrition_plans')
      .insert(planData)
      .select()
    return { data, error }
  } catch (error) {
    console.error('Error in createDietPlan:', error)
    return { data: null, error }
  }
}

/**
 * Get user's diet plans
 * @param {string} userId - User's unique ID
 * @returns {Promise<{data, error}>} - User's diet plans
 */
export const getUserDietPlans = async (userId) => {
  try {
    const { data, error } = await supabase
      .from('nutrition_plans')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
    return { data, error }
  } catch (error) {
    console.error('Error in getUserDietPlans:', error)
    return { data: null, error }
  }
}

/**
 * Get a specific diet plan by ID
 * @param {string} planId - Diet plan's unique ID
 * @returns {Promise<{data, error}>} - Diet plan data
 */
export const getDietPlan = async (planId) => {
  try {
    const { data, error } = await supabase
      .from('nutrition_plans')
      .select('*')
      .eq('id', planId)
      .single()
    return { data, error }
  } catch (error) {
    console.error('Error in getDietPlan:', error)
    return { data: null, error }
  }
}

// ============================================================================
// FILE UPLOAD FUNCTIONS
// ============================================================================

/**
 * Upload a file to Supabase storage
 * @param {string} bucketName - Storage bucket name
 * @param {string} filePath - Path where file should be stored
 * @param {File} file - File to upload
 * @returns {Promise<{data, error}>} - Upload response
 */
export const uploadFile = async (bucketName, filePath, file) => {
  try {
    const { data, error } = await supabase.storage
      .from(bucketName)
      .upload(filePath, file)
    return { data, error }
  } catch (error) {
    console.error('Error in uploadFile:', error)
    return { data: null, error }
  }
}

/**
 * Get public URL for a file
 * @param {string} bucketName - Storage bucket name
 * @param {string} filePath - Path to the file
 * @returns {string} - Public URL
 */
export const getFileUrl = (bucketName, filePath) => {
  try {
    const { data } = supabase.storage
      .from(bucketName)
      .getPublicUrl(filePath)
    return data.publicUrl
  } catch (error) {
    console.error('Error in getFileUrl:', error)
    return null
  }
}

/**
 * Delete a file from storage
 * @param {string} bucketName - Storage bucket name
 * @param {string} filePath - Path to the file
 * @returns {Promise<{data, error}>} - Delete response
 */
export const deleteFile = async (bucketName, filePath) => {
  try {
    const { data, error } = await supabase.storage
      .from(bucketName)
      .remove([filePath])
    return { data, error }
  } catch (error) {
    console.error('Error in deleteFile:', error)
    return { data: null, error }
  }
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Check if user is authenticated
 * @returns {Promise<boolean>} - True if user is authenticated
 */
export const isAuthenticated = async () => {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    return !!user
  } catch (error) {
    console.error('Error in isAuthenticated:', error)
    return false
  }
}

/**
 * Get user session
 * @returns {Promise<{data, error}>} - Current session data
 */
export const getSession = async () => {
  try {
    const { data: { session }, error } = await supabase.auth.getSession()
    return { data: session, error }
  } catch (error) {
    console.error('Error in getSession:', error)
    return { data: null, error }
  }
}

/**
 * Refresh user session
 * @returns {Promise<{data, error}>} - Refreshed session data
 */
export const refreshSession = async () => {
  try {
    const { data, error } = await supabase.auth.refreshSession()
    return { data, error }
  } catch (error) {
    console.error('Error in refreshSession:', error)
    return { data: null, error }
  }
}

// ============================================================================
// ERROR HANDLING UTILITIES
// ============================================================================

/**
 * Get user-friendly error message
 * @param {Error} error - Error object
 * @param {string} language - Language code ('en' or 'hi')
 * @returns {string} - User-friendly error message
 */
export const getErrorMessage = (error, language = 'en') => {
  const errorMessages = {
    en: {
      'Invalid login credentials': 'Invalid email or password',
      'Email not confirmed': 'Please check your email and confirm your account',
      'User already registered': 'An account with this email already exists',
      'Password should be at least 6 characters': 'Password must be at least 6 characters long',
      'Unable to validate email address': 'Please enter a valid email address',
      'default': 'An error occurred. Please try again.'
    },
    hi: {
      'Invalid login credentials': 'अमान्य ईमेल या पासवर्ड',
      'Email not confirmed': 'कृपया अपना ईमेल जांचें और अपना खाता पुष्टि करें',
      'User already registered': 'इस ईमेल के साथ पहले से ही एक खाता मौजूद है',
      'Password should be at least 6 characters': 'पासवर्ड कम से कम 6 अक्षर का होना चाहिए',
      'Unable to validate email address': 'कृपया एक वैध ईमेल पता दर्ज करें',
      'default': 'एक त्रुटि हुई। कृपया पुनः प्रयास करें।'
    }
  }

  const messages = errorMessages[language] || errorMessages.en
  return messages[error.message] || messages.default
}

export default supabase 