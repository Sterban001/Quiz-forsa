import 'package:hive/hive.dart';

part 'hive_models.g.dart';

@HiveType(typeId: 0)
class CachedTest extends HiveObject {
  @HiveField(0)
  final String id;

  @HiveField(1)
  final String title;

  @HiveField(2)
  final String? description;

  @HiveField(3)
  final String? category;

  @HiveField(4)
  final int? timeLimitMinutes;

  @HiveField(5)
  final int passScore;

  @HiveField(6)
  final bool negativMarking;

  @HiveField(7)
  final bool shuffleQuestions;

  @HiveField(8)
  final String? coverImageUrl;

  @HiveField(9)
  final String rawData; // JSON string of full test data

  @HiveField(10)
  final DateTime cachedAt;

  CachedTest({
    required this.id,
    required this.title,
    this.description,
    this.category,
    this.timeLimitMinutes,
    required this.passScore,
    required this.negativMarking,
    required this.shuffleQuestions,
    this.coverImageUrl,
    required this.rawData,
    required this.cachedAt,
  });
}

@HiveType(typeId: 1)
class PendingAttempt extends HiveObject {
  @HiveField(0)
  final String id;

  @HiveField(1)
  final String testId;

  @HiveField(2)
  final String userId;

  @HiveField(3)
  final DateTime startedAt;

  @HiveField(4)
  final String answersJson; // JSON string of answers

  @HiveField(5)
  final int durationSeconds;

  @HiveField(6)
  final bool submitted;

  @HiveField(7)
  final DateTime lastUpdated;

  PendingAttempt({
    required this.id,
    required this.testId,
    required this.userId,
    required this.startedAt,
    required this.answersJson,
    required this.durationSeconds,
    this.submitted = false,
    required this.lastUpdated,
  });
}

@HiveType(typeId: 2)
class LocalAnswer extends HiveObject {
  @HiveField(0)
  final String attemptId;

  @HiveField(1)
  final String questionId;

  @HiveField(2)
  final String responseJson; // Stored as JSON string

  @HiveField(3)
  final int timeSpentSeconds;

  @HiveField(4)
  final bool markedForReview;

  @HiveField(5)
  final DateTime lastUpdated;

  LocalAnswer({
    required this.attemptId,
    required this.questionId,
    required this.responseJson,
    required this.timeSpentSeconds,
    this.markedForReview = false,
    required this.lastUpdated,
  });
}
