import 'package:hive_flutter/hive_flutter.dart';
import 'package:quiz_app/core/models/hive_models.dart';

class StorageService {
  static const String _cachedTestsBox = 'cached_tests';
  static const String _pendingAttemptsBox = 'pending_attempts';
  static const String _localAnswersBox = 'local_answers';
  static const String _userPrefsBox = 'user_prefs';

  static Future<void> initialize() async {
    await Hive.initFlutter();

    // Register adapters
    Hive.registerAdapter(CachedTestAdapter());
    Hive.registerAdapter(PendingAttemptAdapter());
    Hive.registerAdapter(LocalAnswerAdapter());

    // Open boxes
    await Hive.openBox<CachedTest>(_cachedTestsBox);
    await Hive.openBox<PendingAttempt>(_pendingAttemptsBox);
    await Hive.openBox<LocalAnswer>(_localAnswersBox);
    await Hive.openBox(_userPrefsBox);
  }

  // Cached Tests
  static Box<CachedTest> get cachedTestsBox => Hive.box<CachedTest>(_cachedTestsBox);

  static Future<void> cacheTest(CachedTest test) async {
    await cachedTestsBox.put(test.id, test);
  }

  static CachedTest? getCachedTest(String testId) {
    return cachedTestsBox.get(testId);
  }

  static List<CachedTest> getAllCachedTests() {
    return cachedTestsBox.values.toList();
  }

  static Future<void> removeCachedTest(String testId) async {
    await cachedTestsBox.delete(testId);
  }

  static Future<void> clearAllCachedTests() async {
    await cachedTestsBox.clear();
  }

  // Pending Attempts
  static Box<PendingAttempt> get pendingAttemptsBox =>
      Hive.box<PendingAttempt>(_pendingAttemptsBox);

  static Future<void> savePendingAttempt(PendingAttempt attempt) async {
    await pendingAttemptsBox.put(attempt.id, attempt);
  }

  static PendingAttempt? getPendingAttempt(String attemptId) {
    return pendingAttemptsBox.get(attemptId);
  }

  static List<PendingAttempt> getAllPendingAttempts() {
    return pendingAttemptsBox.values.toList();
  }

  static List<PendingAttempt> getPendingAttemptsByUser(String userId) {
    return pendingAttemptsBox.values.where((a) => a.userId == userId).toList();
  }

  static Future<void> removePendingAttempt(String attemptId) async {
    await pendingAttemptsBox.delete(attemptId);
  }

  // Local Answers
  static Box<LocalAnswer> get localAnswersBox => Hive.box<LocalAnswer>(_localAnswersBox);

  static Future<void> saveLocalAnswer(LocalAnswer answer) async {
    final key = '${answer.attemptId}_${answer.questionId}';
    await localAnswersBox.put(key, answer);
  }

  static LocalAnswer? getLocalAnswer(String attemptId, String questionId) {
    final key = '${attemptId}_$questionId';
    return localAnswersBox.get(key);
  }

  static List<LocalAnswer> getLocalAnswersForAttempt(String attemptId) {
    return localAnswersBox.values
        .where((answer) => answer.attemptId == attemptId)
        .toList();
  }

  static Future<void> removeLocalAnswersForAttempt(String attemptId) async {
    final keys = localAnswersBox.values
        .where((answer) => answer.attemptId == attemptId)
        .map((answer) => '${answer.attemptId}_${answer.questionId}')
        .toList();

    for (final key in keys) {
      await localAnswersBox.delete(key);
    }
  }

  // User Preferences
  static Box get userPrefsBox => Hive.box(_userPrefsBox);

  static Future<void> saveUserPref(String key, dynamic value) async {
    await userPrefsBox.put(key, value);
  }

  static T? getUserPref<T>(String key) {
    return userPrefsBox.get(key) as T?;
  }

  static Future<void> removeUserPref(String key) async {
    await userPrefsBox.delete(key);
  }

  static Future<void> clearUserPrefs() async {
    await userPrefsBox.clear();
  }

  // Clear all data
  static Future<void> clearAll() async {
    await cachedTestsBox.clear();
    await pendingAttemptsBox.clear();
    await localAnswersBox.clear();
    await userPrefsBox.clear();
  }
}
