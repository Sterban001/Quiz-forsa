import 'package:supabase_flutter/supabase_flutter.dart';
import 'package:quiz_app/core/config/env.dart';

class SupabaseService {
  static SupabaseClient? _instance;

  static Future<void> initialize() async {
    if (!Env.isConfigured) {
      throw Exception('Supabase environment variables not configured');
    }

    await Supabase.initialize(
      url: Env.supabaseUrl,
      anonKey: Env.supabaseAnonKey,
    );

    _instance = Supabase.instance.client;
  }

  static SupabaseClient get client {
    if (_instance == null) {
      throw Exception('SupabaseService not initialized. Call initialize() first.');
    }
    return _instance!;
  }

  static User? get currentUser => client.auth.currentUser;

  static String? get currentUserId => currentUser?.id;

  static bool get isAuthenticated => currentUser != null;

  static Stream<AuthState> get authStateChanges => client.auth.onAuthStateChange;
}
