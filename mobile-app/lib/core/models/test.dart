import 'package:freezed_annotation/freezed_annotation.dart';

part 'test.freezed.dart';
part 'test.g.dart';

@freezed
class Test with _$Test {
  const factory Test({
    required String id,
    required String title,
    String? description,
    String? category,
    @Default([]) List<String> tags,
    String? coverImageUrl,
    int? timeLimitMinutes,
    DateTime? startAt,
    DateTime? endAt,
    int? perQuestionTimeSeconds,
    @Default('public') String visibility,
    String? accessCode,
    @Default(1) int maxAttempts,
    @Default(70) int passScore,
    @Default(false) bool negativMarking,
    @Default(false) bool shuffleQuestions,
    @Default(true) bool showCorrectAnswers,
    @Default(true) bool showExplanations,
    @Default('draft') String status,
    required String createdBy,
    required DateTime createdAt,
    required DateTime updatedAt,
    @Default([]) List<Question> questions,
    @Default([]) List<Section> sections,
  }) = _Test;

  factory Test.fromJson(Map<String, dynamic> json) => _$TestFromJson(json);
}

@freezed
class Section with _$Section {
  const factory Section({
    required String id,
    required String testId,
    required String title,
    String? description,
    @Default(0) int orderIndex,
    int? perSectionTimeSeconds,
  }) = _Section;

  factory Section.fromJson(Map<String, dynamic> json) => _$SectionFromJson(json);
}

@freezed
class Question with _$Question {
  const factory Question({
    required String id,
    required String testId,
    String? sectionId,
    required String type,
    required String prompt,
    String? explanation,
    @Default(0) int orderIndex,
    @Default(1) double points,
    double? toleranceNumeric,
    @Default([]) List<QuestionOption> questionOptions,
  }) = _Question;

  factory Question.fromJson(Map<String, dynamic> json) => _$QuestionFromJson(json);
}

@freezed
class QuestionOption with _$QuestionOption {
  const factory QuestionOption({
    required String id,
    required String questionId,
    required String label,
    @Default(false) bool isCorrect,
    @Default(0) int orderIndex,
  }) = _QuestionOption;

  factory QuestionOption.fromJson(Map<String, dynamic> json) =>
      _$QuestionOptionFromJson(json);
}

@freezed
class Attempt with _$Attempt {
  const factory Attempt({
    required String id,
    required String testId,
    required String userId,
    required DateTime startedAt,
    DateTime? submittedAt,
    @Default(0) double score,
    @Default(0) double maxScore,
    @Default('in_progress') String status,
    @Default(0) int durationSeconds,
    @Default(1) int attemptNo,
    @Default([]) List<AttemptAnswer> answers,
  }) = _Attempt;

  factory Attempt.fromJson(Map<String, dynamic> json) => _$AttemptFromJson(json);
}

@freezed
class AttemptAnswer with _$AttemptAnswer {
  const factory AttemptAnswer({
    required String id,
    required String attemptId,
    required String questionId,
    Map<String, dynamic>? responseJson,
    bool? isCorrect,
    @Default(0) double awardedPoints,
    @Default(0) int timeSpentSeconds,
  }) = _AttemptAnswer;

  factory AttemptAnswer.fromJson(Map<String, dynamic> json) =>
      _$AttemptAnswerFromJson(json);
}
