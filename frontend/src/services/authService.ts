import { supabase } from '../lib/supabaseClient';
import { UserRole } from '../types';

export interface AuthProfile {
  id: string;
  userId?: string;
  name: string;
  email: string;
  role: UserRole;
  phone?: string;
  state?: string;
  location?: string;
  organization?: string;
  isVerified: boolean;
}

export interface SignUpParams {
  email: string;
  password: string;
  role: UserRole;
  name: string;
  phone: string;
  location: string;
  organization: string;
}

export interface SignInParams {
  email: string;
  password: string;
}

// 1. Sign Up with Supabase Auth & Create Profile
export const signUpWithSupabase = async (params: SignUpParams): Promise<{ user: any; profile: AuthProfile | null; error?: string; requiresEmailConfirmation?: boolean }> => {
  try {
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: params.email,
      password: params.password,
      options: {
        data: {
          name: params.name,
          role: params.role,
          phone: params.phone,
          location: params.location,
          organization: params.organization,
        }
      }
    });

    if (authError) {
      return { user: null, profile: null, error: authError.message };
    }

    const authUserId = authData.user?.id;

    // Create entry in public.profiles table
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .insert([
        {
          auth_user_id: authUserId,
          name: params.name,
          email: params.email,
          phone: params.phone,
          role: params.role,
          location: params.location,
          is_verified: true,
        }
      ])
      .select()
      .single();

    if (profileError) {
      console.warn('Profile creation note:', profileError.message);
    }

    // Create role specific entry
    if (params.role === 'farmer') {
      await supabase.from('farmers').insert([
        {
          profile_id: profileData?.id,
          farm_name: params.organization || `${params.name}'s Farm`,
          fpo_member_count: 50,
          rating: 5.0,
          completed_deals: 0,
        }
      ]);
    } else {
      await supabase.from('buyers').insert([
        {
          profile_id: profileData?.id,
          company_name: params.organization || `${params.name} Enterprise`,
          company_type: 'FMCG',
        }
      ]);
    }

    const createdProfile: AuthProfile = {
      id: profileData?.id || authUserId || 'user-' + Date.now(),
      userId: authUserId,
      name: params.name,
      email: params.email,
      role: params.role,
      phone: params.phone,
      location: params.location,
      organization: params.organization,
      isVerified: true,
    };

    // If session is null, email confirmation might be required in Supabase
    const requiresEmailConfirmation = !authData.session;

    return { user: authData.user, profile: createdProfile, requiresEmailConfirmation };
  } catch (err: any) {
    return { user: null, profile: null, error: err.message || 'An error occurred during registration.' };
  }
};

// 2. Sign In with Supabase Auth
export const signInWithSupabase = async (params: SignInParams): Promise<{ user: any; profile: AuthProfile | null; error?: string }> => {
  try {
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: params.email,
      password: params.password,
    });

    if (authError) {
      return { user: null, profile: null, error: authError.message };
    }

    const authUser = authData.user;
    let userRole: UserRole = (authUser?.user_metadata?.role as UserRole) || 'farmer';
    let userName: string = authUser?.user_metadata?.name || authUser?.email?.split('@')[0] || 'Member';
    let organization: string = authUser?.user_metadata?.organization || '';

    // Fetch corresponding profile from profiles table if exists
    const { data: profileRecord } = await supabase
      .from('profiles')
      .select('*')
      .eq('auth_user_id', authUser?.id)
      .maybeSingle();

    if (profileRecord) {
      userRole = profileRecord.role || userRole;
      userName = profileRecord.name || userName;
      
      // Fetch organization from specific role tables
      if (userRole === 'farmer') {
        const { data: farmerRec } = await supabase.from('farmers').select('farm_name').eq('profile_id', profileRecord.id).maybeSingle();
        if (farmerRec?.farm_name) organization = farmerRec.farm_name;
      } else {
        const { data: buyerRec } = await supabase.from('buyers').select('company_name').eq('profile_id', profileRecord.id).maybeSingle();
        if (buyerRec?.company_name) organization = buyerRec.company_name;
      }
    }

    const profile: AuthProfile = {
      id: profileRecord?.id || authUser?.id || '',
      userId: authUser?.id,
      name: userName,
      email: authUser?.email || params.email,
      role: userRole,
      phone: profileRecord?.phone || authUser?.user_metadata?.phone,
      location: profileRecord?.location || authUser?.user_metadata?.location,
      organization,
      isVerified: true,
    };

    return { user: authUser, profile };
  } catch (err: any) {
    return { user: null, profile: null, error: err.message || 'An error occurred during sign in.' };
  }
};

// 3. Sign Out
export const signOutWithSupabase = async (): Promise<boolean> => {
  try {
    const { error } = await supabase.auth.signOut();
    return !error;
  } catch {
    return false;
  }
};

// 4. Get Current User Session
export const getCurrentAuthUser = async (): Promise<AuthProfile | null> => {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) return null;

    const authUser = session.user;
    const { data: profileRecord } = await supabase
      .from('profiles')
      .select('*')
      .eq('auth_user_id', authUser.id)
      .maybeSingle();

    const role = (profileRecord?.role || authUser.user_metadata?.role || 'farmer') as UserRole;
    let organization = authUser.user_metadata?.organization || '';

    if (profileRecord) {
      if (role === 'farmer') {
        const { data: farmerRec } = await supabase.from('farmers').select('farm_name').eq('profile_id', profileRecord.id).maybeSingle();
        if (farmerRec?.farm_name) organization = farmerRec.farm_name;
      } else {
        const { data: buyerRec } = await supabase.from('buyers').select('company_name').eq('profile_id', profileRecord.id).maybeSingle();
        if (buyerRec?.company_name) organization = buyerRec.company_name;
      }
    }

    return {
      id: profileRecord?.id || authUser.id,
      userId: authUser.id,
      name: profileRecord?.name || authUser.user_metadata?.name || authUser.email?.split('@')[0] || 'Member',
      email: authUser.email || '',
      role,
      phone: profileRecord?.phone || authUser.user_metadata?.phone,
      location: profileRecord?.location || authUser.user_metadata?.location,
      organization,
      isVerified: true,
    };
  } catch {
    return null;
  }
};
