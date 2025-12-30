import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import * as WebBrowser from 'expo-web-browser';
import * as AuthSession from 'expo-auth-session';

// Complete the auth session for better UX
WebBrowser.maybeCompleteAuthSession();

export interface AuthUser {
  id: string;
  email?: string;
  name?: string;
}

class AuthAPI {
  async signInWithEmail(email: string, password: string): Promise<AuthUser> {
    if (!isSupabaseConfigured()) {
      throw new Error('Supabase not configured');
    }

    const { data, error } = await supabase!.auth.signInWithPassword({
      email,
      password,
    });

    if (error) throw error;
    if (!data.user) throw new Error('No user returned');

    return {
      id: data.user.id,
      email: data.user.email,
      name: data.user.user_metadata?.name,
    };
  }

  async signUpWithEmail(email: string, password: string, name?: string): Promise<AuthUser> {
    if (!isSupabaseConfigured()) {
      throw new Error('Supabase not configured');
    }

    const { data, error } = await supabase!.auth.signUp({
      email,
      password,
      options: {
        data: {
          name: name || email.split('@')[0],
        },
      },
    });

    if (error) throw error;
    if (!data.user) throw new Error('No user returned');

    return {
      id: data.user.id,
      email: data.user.email,
      name: data.user.user_metadata?.name,
    };
  }

  async signInWithGoogle(): Promise<AuthUser> {
    if (!isSupabaseConfigured()) {
      throw new Error('Supabase not configured');
    }

    const redirectUrl = AuthSession.makeRedirectUri({
      scheme: 'lifeos',
      path: 'auth/callback',
    });

    const { data, error } = await supabase!.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: redirectUrl,
      },
    });

    if (error) throw error;
    if (!data.url) throw new Error('No OAuth URL returned');

    // Open browser for OAuth
    const result = await WebBrowser.openAuthSessionAsync(data.url, redirectUrl);

    if (result.type === 'success') {
      const url = new URL(result.url);
      const accessToken = url.searchParams.get('access_token');
      const refreshToken = url.searchParams.get('refresh_token');

      if (accessToken && refreshToken) {
        const { data: sessionData, error: sessionError } = await supabase!.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken,
        });

        if (sessionError) throw sessionError;
        if (!sessionData.user) throw new Error('No user returned');

        return {
          id: sessionData.user.id,
          email: sessionData.user.email,
          name: sessionData.user.user_metadata?.name,
        };
      }
    }

    throw new Error('OAuth flow failed');
  }

  async signInWithApple(): Promise<AuthUser> {
    if (!isSupabaseConfigured()) {
      throw new Error('Supabase not configured');
    }

    const redirectUrl = AuthSession.makeRedirectUri({
      scheme: 'lifeos',
      path: 'auth/callback',
    });

    const { data, error } = await supabase!.auth.signInWithOAuth({
      provider: 'apple',
      options: {
        redirectTo: redirectUrl,
      },
    });

    if (error) throw error;
    if (!data.url) throw new Error('No OAuth URL returned');

    const result = await WebBrowser.openAuthSessionAsync(data.url, redirectUrl);

    if (result.type === 'success') {
      const url = new URL(result.url);
      const accessToken = url.searchParams.get('access_token');
      const refreshToken = url.searchParams.get('refresh_token');

      if (accessToken && refreshToken) {
        const { data: sessionData, error: sessionError } = await supabase!.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken,
        });

        if (sessionError) throw sessionError;
        if (!sessionData.user) throw new Error('No user returned');

        return {
          id: sessionData.user.id,
          email: sessionData.user.email,
          name: sessionData.user.user_metadata?.name,
        };
      }
    }

    throw new Error('OAuth flow failed');
  }

  async signInWithMagicLink(email: string): Promise<void> {
    if (!isSupabaseConfigured()) {
      throw new Error('Supabase not configured');
    }

    const redirectUrl = AuthSession.makeRedirectUri({
      scheme: 'lifeos',
      path: 'auth/callback',
    });

    const { error } = await supabase!.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: redirectUrl,
      },
    });

    if (error) throw error;
  }

  async signOut(): Promise<void> {
    if (!isSupabaseConfigured()) {
      throw new Error('Supabase not configured');
    }

    const { error } = await supabase!.auth.signOut();
    if (error) throw error;
  }

  async getCurrentUser(): Promise<AuthUser | null> {
    if (!isSupabaseConfigured()) {
      return null;
    }

    const { data: { user }, error } = await supabase!.auth.getUser();

    if (error || !user) return null;

    return {
      id: user.id,
      email: user.email,
      name: user.user_metadata?.name,
    };
  }

  async getSession() {
    if (!isSupabaseConfigured()) {
      return null;
    }

    const { data: { session }, error } = await supabase!.auth.getSession();
    if (error) throw error;
    return session;
  }
}

export const authAPI = new AuthAPI();

