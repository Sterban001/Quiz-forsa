class Env {
  static const String supabaseUrl = String.fromEnvironment(
    'SUPABASE_URL',
    defaultValue: 'https://irqphcvvvdrflsgselky.supabase.co',
  );

  static const String supabaseAnonKey = String.fromEnvironment(
    'SUPABASE_ANON_KEY',
    defaultValue: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlycXBoY3Z2dmRyZmxzZ3NlbGt5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE5MTI5NzYsImV4cCI6MjA3NzQ4ODk3Nn0.eDYLIx1yb_8LRZ326Y1Ww89flO9Dn2ZwXlzyyRGspa4',
  );

  static bool get isConfigured =>
      supabaseUrl.isNotEmpty && supabaseAnonKey.isNotEmpty;
}
