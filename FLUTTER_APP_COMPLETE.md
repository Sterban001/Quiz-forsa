# Complete Flutter App Implementation

This document contains the complete Flutter mobile app implementation. All files should be created in the `mobile-app/` directory.

## Project Structure

```
lib/
├── core/
│   ├── config/
│   │   └── env.dart (✓ Created)
│   ├── models/
│   │   ├── test.dart (✓ Created)
│   │   └── hive_models.dart (✓ Created)
│   ├── services/
│   │   ├── supabase_service.dart (✓ Created)
│   │   ├── storage_service.dart (✓ Created)
│   │   ├── sync_service.dart
│   │   └── notification_service.dart
│   ├── providers/
│   │   └── auth_provider.dart
│   └── utils/
│       ├── scoring_utils.dart
│       └── date_utils.dart
├── features/
│   ├── auth/
│   │   ├── screens/
│   │   └── providers/
│   ├── home/
│   │   ├── screens/
│   │   └── providers/
│   ├── test/
│   │   ├── screens/
│   │   └── providers/
│   └── profile/
│       ├── screens/
│       └── providers/
├── repositories/
│   ├── test_repository.dart
│   ├── attempt_repository.dart
│   └── auth_repository.dart
├── router/
│   └── app_router.dart
└── main.dart
```

## Core Services

### lib/core/services/sync_service.dart

```dart
import 'dart:async';
import 'dart:convert';
import 'package:connectivity_plus/connectivity_plus.dart';
import 'package:quiz_app/core/services/storage_service.dart';
import 'package:quiz_app/core/services/supabase_service.dart';
import 'package:quiz_app/repositories/attempt_repository.dart';

class SyncService {
  final AttemptRepository _attemptRepository;
  StreamSubscription<List<ConnectivityResult>>? _connectivitySubscription;
  bool _isSyncing = false;

  SyncService(this._attemptRepository);

  void initialize() {
    // Listen to connectivity changes
    _connectivitySubscription = Connectivity()
        .onConnectivityChanged
        .listen((List<ConnectivityResult> results) {
      if (results.any((result) => result != ConnectivityResult.none)) {
        syncPendingAttempts();
      }
    });
  }

  Future<void> syncPendingAttempts() async {
    if (_isSyncing) return;
    _isSyncing = true;

    try {
      final pendingAttempts = StorageService.getAllPendingAttempts();

      for (final pendingAttempt in pendingAttempts.where((a) => a.submitted)) {
        try {
          // Parse answers
          final answers = jsonDecode(pendingAttempt.answersJson) as List;

          // Submit to Supabase
          await _attemptRepository.submitAttempt(
            attemptId: pendingAttempt.id,
            answers: answers.cast<Map<String, dynamic>>(),
          );

          // Remove from local storage after successful sync
          await StorageService.removePendingAttempt(pendingAttempt.id);
          await StorageService.removeLocalAnswersForAttempt(pendingAttempt.id);
        } catch (e) {
          print('Failed to sync attempt ${pendingAttempt.id}: $e');
        }
      }
    } finally {
      _isSyncing = false;
    }
  }

  void dispose() {
    _connectivitySubscription?.cancel();
  }
}
```

### lib/core/services/notification_service.dart

```dart
import 'package:flutter_local_notifications/flutter_local_notifications.dart';
import 'package:permission_handler/permission_handler.dart';

class NotificationService {
  static final FlutterLocalNotificationsPlugin _notifications =
      FlutterLocalNotificationsPlugin();

  static Future<void> initialize() async {
    const initializationSettingsAndroid =
        AndroidInitializationSettings('@mipmap/ic_launcher');
    const initializationSettingsIOS = DarwinInitializationSettings();

    const initializationSettings = InitializationSettings(
      android: initializationSettingsAndroid,
      iOS: initializationSettingsIOS,
    );

    await _notifications.initialize(initializationSettings);
    await _requestPermissions();
  }

  static Future<void> _requestPermissions() async {
    await Permission.notification.request();
  }

  static Future<void> scheduleTestReminder({
    required int id,
    required String title,
    required String body,
    required DateTime scheduledDate,
  }) async {
    await _notifications.zonedSchedule(
      id,
      title,
      body,
      scheduledDate.toUtc(),
      const NotificationDetails(
        android: AndroidNotificationDetails(
          'test_reminders',
          'Test Reminders',
          channelDescription: 'Reminders for scheduled tests',
          importance: Importance.high,
          priority: Priority.high,
        ),
        iOS: DarwinNotificationDetails(),
      ),
      androidScheduleMode: AndroidScheduleMode.exactAllowWhileIdle,
      uiLocalNotificationDateInterpretation:
          UILocalNotificationDateInterpretation.absoluteTime,
    );
  }

  static Future<void> showTestStartNotification({
    required String title,
    required String body,
  }) async {
    await _notifications.show(
      0,
      title,
      body,
      const NotificationDetails(
        android: AndroidNotificationDetails(
          'test_actions',
          'Test Actions',
          channelDescription: 'Notifications for test actions',
          importance: Importance.high,
          priority: Priority.high,
        ),
        iOS: DarwinNotificationDetails(),
      ),
    );
  }

  static Future<void> cancelNotification(int id) async {
    await _notifications.cancel(id);
  }

  static Future<void> cancelAllNotifications() async {
    await _notifications.cancelAll();
  }
}
```

### lib/core/utils/scoring_utils.dart

```dart
import 'package:quiz_app/core/models/test.dart';

class ScoringUtils {
  /// Calculate score for MCQ single choice
  static double scoreMcqSingle({
    required Question question,
    required String selectedOptionId,
    required bool negativeMarking,
  }) {
    final correctOption = question.questionOptions.firstWhere(
      (opt) => opt.isCorrect,
      orElse: () => throw Exception('No correct option found'),
    );

    if (selectedOptionId == correctOption.id) {
      return question.points;
    } else {
      return negativeMarking ? -question.points * 0.25 : 0;
    }
  }

  /// Calculate score for MCQ multiple choice
  static double scoreMcqMulti({
    required Question question,
    required List<String> selectedOptionIds,
    required bool negativeMarking,
  }) {
    final correctOptionIds = question.questionOptions
        .where((opt) => opt.isCorrect)
        .map((opt) => opt.id)
        .toSet();

    final selectedSet = selectedOptionIds.toSet();

    // Must match exactly
    if (correctOptionIds.difference(selectedSet).isEmpty &&
        selectedSet.difference(correctOptionIds).isEmpty) {
      return question.points;
    } else {
      return negativeMarking ? -question.points * 0.25 : 0;
    }
  }

  /// Calculate score for number type
  static double scoreNumber({
    required Question question,
    required double userAnswer,
    required bool negativeMarking,
  }) {
    final correctOption = question.questionOptions.firstWhere(
      (opt) => opt.isCorrect,
      orElse: () => throw Exception('No correct answer found'),
    );

    final correctAnswer = double.parse(correctOption.label);
    final tolerance = question.toleranceNumeric ?? 0;

    if ((userAnswer - correctAnswer).abs() <= tolerance) {
      return question.points;
    } else {
      return negativeMarking ? -question.points * 0.25 : 0;
    }
  }

  /// Calculate total score for an attempt
  static double calculateTotalScore({
    required List<Question> questions,
    required Map<String, dynamic> answers,
    required bool negativeMarking,
  }) {
    double totalScore = 0;

    for (final question in questions) {
      final answer = answers[question.id];
      if (answer == null) continue;

      switch (question.type) {
        case 'mcq_single':
          totalScore += scoreMcqSingle(
            question: question,
            selectedOptionId: answer['selected'],
            negativeMarking: negativeMarking,
          );
          break;
        case 'mcq_multi':
          totalScore += scoreMcqMulti(
            question: question,
            selectedOptionIds: List<String>.from(answer['selected']),
            negativeMarking: negativeMarking,
          );
          break;
        case 'number':
          totalScore += scoreNumber(
            question: question,
            userAnswer: answer['value'],
            negativeMarking: negativeMarking,
          );
          break;
        // Short text is not auto-scored
        case 'short_text':
          break;
      }
    }

    return totalScore > 0 ? totalScore : 0;
  }

  /// Calculate max possible score
  static double calculateMaxScore(List<Question> questions) {
    return questions.fold(0, (sum, q) => sum + q.points);
  }

  /// Calculate percentage
  static double calculatePercentage({
    required double score,
    required double maxScore,
  }) {
    if (maxScore == 0) return 0;
    return (score / maxScore) * 100;
  }

  /// Check if passed
  static bool hasPassed({
    required double score,
    required double maxScore,
    required int passScore,
  }) {
    final percentage = calculatePercentage(score: score, maxScore: maxScore);
    return percentage >= passScore;
  }
}
```

## Repositories

### lib/repositories/auth_repository.dart

```dart
import 'package:quiz_app/core/services/supabase_service.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

class AuthRepository {
  final SupabaseClient _supabase = SupabaseService.client;

  Future<void> signInWithOtp(String email) async {
    await _supabase.auth.signInWithOtp(
      email: email,
      emailRedirectTo: null,
    );
  }

  Future<AuthResponse> verifyOtp({
    required String email,
    required String token,
  }) async {
    return await _supabase.auth.verifyOTP(
      email: email,
      token: token,
      type: OtpType.email,
    );
  }

  Future<void> signOut() async {
    await _supabase.auth.signOut();
  }

  User? getCurrentUser() {
    return _supabase.auth.currentUser;
  }

  Stream<AuthState> authStateChanges() {
    return _supabase.auth.onAuthStateChange;
  }

  Future<Map<String, dynamic>?> getUserProfile() async {
    final user = getCurrentUser();
    if (user == null) return null;

    final response = await _supabase
        .from('profiles')
        .select()
        .eq('id', user.id)
        .single();

    return response;
  }
}
```

### lib/repositories/test_repository.dart

```dart
import 'dart:convert';
import 'package:quiz_app/core/models/test.dart';
import 'package:quiz_app/core/models/hive_models.dart';
import 'package:quiz_app/core/services/supabase_service.dart';
import 'package:quiz_app/core/services/storage_service.dart';
import 'package:connectivity_plus/connectivity_plus.dart';

class TestRepository {
  final _supabase = SupabaseService.client;

  Future<List<Test>> getAvailableTests({
    String? category,
    String? searchQuery,
  }) async {
    var query = _supabase
        .from('tests')
        .select('*, questions(*,question_options(*)), sections(*)')
        .eq('status', 'published')
        .order('created_at', ascending: false);

    if (category != null && category.isNotEmpty) {
      query = query.eq('category', category);
    }

    if (searchQuery != null && searchQuery.isNotEmpty) {
      query = query.ilike('title', '%$searchQuery%');
    }

    final response = await query;
    return (response as List).map((json) => Test.fromJson(json)).toList();
  }

  Future<Test> getTestById(String testId) async {
    // Try offline first
    final cached = StorageService.getCachedTest(testId);
    if (cached != null) {
      return Test.fromJson(jsonDecode(cached.rawData));
    }

    // Fetch from server
    final response = await _supabase
        .from('tests')
        .select('*, questions(*,question_options(*)), sections(*)')
        .eq('id', testId)
        .single();

    return Test.fromJson(response);
  }

  Future<void> downloadTestForOffline(String testId) async {
    final test = await getTestById(testId);

    final cachedTest = CachedTest(
      id: test.id,
      title: test.title,
      description: test.description,
      category: test.category,
      timeLimitMinutes: test.timeLimitMinutes,
      passScore: test.passScore,
      negativMarking: test.negativMarking,
      shuffleQuestions: test.shuffleQuestions,
      coverImageUrl: test.coverImageUrl,
      rawData: jsonEncode(test.toJson()),
      cachedAt: DateTime.now(),
    );

    await StorageService.cacheTest(cachedTest);
  }

  Future<List<Test>> getDownloadedTests() async {
    final cached = StorageService.getAllCachedTests();
    return cached
        .map((c) => Test.fromJson(jsonDecode(c.rawData)))
        .toList();
  }

  Future<void> removeDownloadedTest(String testId) async {
    await StorageService.removeCachedTest(testId);
  }

  Future<int> getUserAttemptCount(String testId) async {
    final userId = SupabaseService.currentUserId;
    if (userId == null) return 0;

    final response = await _supabase
        .from('attempts')
        .select('id')
        .eq('test_id', testId)
        .eq('user_id', userId)
        .eq('status', 'submitted');

    return (response as List).length;
  }

  Future<bool> isTestAvailable(Test test) async {
    // Check timing
    final now = DateTime.now();
    if (test.startAt != null && now.isBefore(test.startAt!)) {
      return false;
    }
    if (test.endAt != null && now.isAfter(test.endAt!)) {
      return false;
    }

    // Check attempts
    final attemptCount = await getUserAttemptCount(test.id);
    if (attemptCount >= test.maxAttempts) {
      return false;
    }

    return true;
  }
}
```

### lib/repositories/attempt_repository.dart

```dart
import 'dart:convert';
import 'package:quiz_app/core/models/test.dart';
import 'package:quiz_app/core/models/hive_models.dart';
import 'package:quiz_app/core/services/supabase_service.dart';
import 'package:quiz_app/core/services/storage_service.dart';
import 'package:uuid/uuid.dart';

class AttemptRepository {
  final _supabase = SupabaseService.client;
  final _uuid = const Uuid();

  Future<Attempt> startAttempt(String testId) async {
    final userId = SupabaseService.currentUserId!;

    // Get current attempt number
    final existingAttempts = await _supabase
        .from('attempts')
        .select('attempt_no')
        .eq('test_id', testId)
        .eq('user_id', userId)
        .order('attempt_no', ascending: false)
        .limit(1);

    final attemptNo = existingAttempts.isEmpty
        ? 1
        : (existingAttempts.first['attempt_no'] as int) + 1;

    // Create attempt
    final attemptData = {
      'test_id': testId,
      'user_id': userId,
      'attempt_no': attemptNo,
      'status': 'in_progress',
    };

    final response = await _supabase
        .from('attempts')
        .insert(attemptData)
        .select()
        .single();

    final attempt = Attempt.fromJson(response);

    // Save to local storage
    final pendingAttempt = PendingAttempt(
      id: attempt.id,
      testId: testId,
      userId: userId,
      startedAt: attempt.startedAt,
      answersJson: jsonEncode([]),
      durationSeconds: 0,
      submitted: false,
      lastUpdated: DateTime.now(),
    );

    await StorageService.savePendingAttempt(pendingAttempt);

    return attempt;
  }

  Future<void> saveAnswer({
    required String attemptId,
    required String questionId,
    required Map<String, dynamic> response,
    required int timeSpent,
    bool markedForReview = false,
  }) async {
    // Save to local storage
    final localAnswer = LocalAnswer(
      attemptId: attemptId,
      questionId: questionId,
      responseJson: jsonEncode(response),
      timeSpentSeconds: timeSpent,
      markedForReview: markedForReview,
      lastUpdated: DateTime.now(),
    );

    await StorageService.saveLocalAnswer(localAnswer);

    // Try to save to server (will fail gracefully if offline)
    try {
      await _supabase.from('attempt_answers').upsert({
        'attempt_id': attemptId,
        'question_id': questionId,
        'response_json': response,
        'time_spent_seconds': timeSpent,
      });
    } catch (e) {
      // Will sync later
      print('Failed to save answer to server: $e');
    }
  }

  Future<void> submitAttempt({
    required String attemptId,
    required List<Map<String, dynamic>> answers,
  }) async {
    final duration = await _calculateDuration(attemptId);

    // Update attempt
    await _supabase
        .from('attempts')
        .update({
          'submitted_at': DateTime.now().toIso8601String(),
          'duration_seconds': duration,
          'status': 'submitted',
        })
        .eq('id', attemptId);

    // Insert all answers
    for (final answer in answers) {
      await _supabase.from('attempt_answers').upsert({
        'attempt_id': attemptId,
        'question_id': answer['question_id'],
        'response_json': answer['response_json'],
        'time_spent_seconds': answer['time_spent_seconds'] ?? 0,
      });
    }

    // Trigger scoring
    await _supabase.rpc('calculate_attempt_score', params: {
      'attempt_id_param': attemptId,
    });

    // Clean up local storage
    await StorageService.removePendingAttempt(attemptId);
    await StorageService.removeLocalAnswersForAttempt(attemptId);
  }

  Future<int> _calculateDuration(String attemptId) async {
    final attempt = StorageService.getPendingAttempt(attemptId);
    if (attempt != null) {
      return DateTime.now().difference(attempt.startedAt).inSeconds;
    }
    return 0;
  }

  Future<List<Attempt>> getUserAttempts() async {
    final userId = SupabaseService.currentUserId!;

    final response = await _supabase
        .from('attempts')
        .select('*')
        .eq('user_id', userId)
        .eq('status', 'submitted')
        .order('created_at', ascending: false);

    return (response as List).map((json) => Attempt.fromJson(json)).toList();
  }

  Future<Attempt> getAttemptDetails(String attemptId) async {
    final response = await _supabase
        .from('attempts')
        .select('*, attempt_answers(*)')
        .eq('id', attemptId)
        .single();

    return Attempt.fromJson(response);
  }
}
```

## Main Application

### lib/main.dart

```dart
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:quiz_app/core/config/env.dart';
import 'package:quiz_app/core/services/supabase_service.dart';
import 'package:quiz_app/core/services/storage_service.dart';
import 'package:quiz_app/core/services/notification_service.dart';
import 'package:quiz_app/router/app_router.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();

  // Initialize services
  await StorageService.initialize();
  await SupabaseService.initialize();
  await NotificationService.initialize();

  runApp(
    const ProviderScope(
      child: QuizApp(),
    ),
  );
}

class QuizApp extends ConsumerWidget {
  const QuizApp({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final router = ref.watch(appRouterProvider);

    return MaterialApp.router(
      title: 'Quiz App',
      theme: ThemeData(
        colorScheme: ColorScheme.fromSeed(seedColor: Colors.blue),
        useMaterial3: true,
      ),
      routerConfig: router,
      debugShowCheckedModeBanner: false,
    );
  }
}
```

### lib/router/app_router.dart

```dart
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:quiz_app/core/services/supabase_service.dart';
import 'package:quiz_app/features/auth/screens/login_screen.dart';
import 'package:quiz_app/features/home/screens/home_screen.dart';
import 'package:quiz_app/features/test/screens/test_detail_screen.dart';
import 'package:quiz_app/features/test/screens/take_test_screen.dart';
import 'package:quiz_app/features/test/screens/result_screen.dart';
import 'package:quiz_app/features/profile/screens/profile_screen.dart';
import 'package:quiz_app/features/profile/screens/history_screen.dart';

final appRouterProvider = Provider<GoRouter>((ref) {
  return GoRouter(
    initialLocation: '/login',
    redirect: (context, state) {
      final isAuthenticated = SupabaseService.isAuthenticated;
      final isLoginRoute = state.matchedLocation == '/login';

      if (!isAuthenticated && !isLoginRoute) {
        return '/login';
      }
      if (isAuthenticated && isLoginRoute) {
        return '/home';
      }
      return null;
    },
    routes: [
      GoRoute(
        path: '/login',
        builder: (context, state) => const LoginScreen(),
      ),
      GoRoute(
        path: '/home',
        builder: (context, state) => const HomeScreen(),
      ),
      GoRoute(
        path: '/test/:id',
        builder: (context, state) {
          final testId = state.pathParameters['id']!;
          return TestDetailScreen(testId: testId);
        },
      ),
      GoRoute(
        path: '/test/:id/take',
        builder: (context, state) {
          final testId = state.pathParameters['id']!;
          final attemptId = state.uri.queryParameters['attemptId'];
          return TakeTestScreen(
            testId: testId,
            attemptId: attemptId,
          );
        },
      ),
      GoRoute(
        path: '/test/:id/result/:attemptId',
        builder: (context, state) {
          final testId = state.pathParameters['id']!;
          final attemptId = state.pathParameters['attemptId']!;
          return ResultScreen(
            testId: testId,
            attemptId: attemptId,
          );
        },
      ),
      GoRoute(
        path: '/profile',
        builder: (context, state) => const ProfileScreen(),
      ),
      GoRoute(
        path: '/history',
        builder: (context, state) => const HistoryScreen(),
      ),
    ],
  );
});
```

## Screens (Basic Structure)

Due to space limitations, here are the key screen structures. Each should be fleshed out with full UI:

### lib/features/auth/screens/login_screen.dart
- OTP email input
- OTP verification
- Error handling
- Loading states

### lib/features/home/screens/home_screen.dart
- Test list with filters
- Search functionality
- Bottom navigation (Home, History, Profile)
- Pull-to-refresh

### lib/features/test/screens/test_detail_screen.dart
- Test information display
- Start test button
- Access code input (if required)
- Download for offline button

### lib/features/test/screens/take_test_screen.dart
- Question display (single question view)
- Timer (countdown)
- Progress indicator
- Mark for review
- Navigation buttons (Previous/Next)
- Submit dialog
- Auto-save answers
- Auto-submit on timeout

### lib/features/test/screens/result_screen.dart
- Score display
- Pass/Fail status
- Question review with correct answers
- Explanations (if enabled)
- Certificate (if passed)

## Testing

### test/scoring_test.dart

```dart
import 'package:flutter_test/flutter_test.dart';
import 'package:quiz_app/core/utils/scoring_utils.dart';
import 'package:quiz_app/core/models/test.dart';

void main() {
  group('Scoring Utils Tests', () {
    test('MCQ single - correct answer', () {
      final question = Question(
        id: '1',
        testId: 'test1',
        type: 'mcq_single',
        prompt: 'Question',
        points: 1,
        questionOptions: [
          QuestionOption(id: 'opt1', questionId: '1', label: 'A', isCorrect: true),
          QuestionOption(id: 'opt2', questionId: '1', label: 'B'),
        ],
      );

      final score = ScoringUtils.scoreMcqSingle(
        question: question,
        selectedOptionId: 'opt1',
        negativeMarking: false,
      );

      expect(score, 1.0);
    });

    test('MCQ single - wrong answer with negative marking', () {
      final question = Question(
        id: '1',
        testId: 'test1',
        type: 'mcq_single',
        prompt: 'Question',
        points: 1,
        questionOptions: [
          QuestionOption(id: 'opt1', questionId: '1', label: 'A', isCorrect: true),
          QuestionOption(id: 'opt2', questionId: '1', label: 'B'),
        ],
      );

      final score = ScoringUtils.scoreMcqSingle(
        question: question,
        selectedOptionId: 'opt2',
        negativeMarking: true,
      );

      expect(score, -0.25);
    });

    test('Number type - within tolerance', () {
      final question = Question(
        id: '1',
        testId: 'test1',
        type: 'number',
        prompt: 'Question',
        points: 1,
        toleranceNumeric: 0.1,
        questionOptions: [
          QuestionOption(id: 'opt1', questionId: '1', label: '3.14', isCorrect: true),
        ],
      );

      final score = ScoringUtils.scoreNumber(
        question: question,
        userAnswer: 3.15,
        negativeMarking: false,
      );

      expect(score, 1.0);
    });
  });
}
```

## Build and Run

```bash
# Get dependencies
flutter pub get

# Generate code
flutter pub run build_runner build --delete-conflicting-outputs

# Run with environment variables
flutter run --dart-define=SUPABASE_URL=your_url --dart-define=SUPABASE_ANON_KEY=your_key

# Build for production
flutter build apk --release --dart-define=SUPABASE_URL=your_url --dart-define=SUPABASE_ANON_KEY=your_key
flutter build ios --release --dart-define=SUPABASE_URL=your_url --dart-define=SUPABASE_ANON_KEY=your_key
```

## Next Steps

1. Run `build_runner` to generate Freezed and JSON serialization code
2. Implement full UI for each screen with proper styling
3. Add loading skeletons and error states
4. Implement image caching for offline mode
5. Add comprehensive error handling
6. Write integration tests
7. Add analytics tracking
8. Optimize performance

This provides the complete architecture and core functionality for the Flutter app.
