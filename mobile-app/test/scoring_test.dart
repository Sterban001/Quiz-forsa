import 'package:flutter_test/flutter_test.dart';

// Mock scoring utility for demonstration
// In actual implementation, import from lib/core/utils/scoring_utils.dart

class ScoringUtils {
  static double scoreMcqSingle({
    required Map<String, dynamic> question,
    required String selectedOptionId,
    required bool negativeMarking,
  }) {
    final correctOptionId = (question['options'] as List)
        .firstWhere((opt) => opt['is_correct'] == true)['id'];

    if (selectedOptionId == correctOptionId) {
      return (question['points'] as num).toDouble();
    } else {
      return negativeMarking
          ? -(question['points'] as num).toDouble() * 0.25
          : 0;
    }
  }

  static double scoreMcqMulti({
    required Map<String, dynamic> question,
    required List<String> selectedOptionIds,
    required bool negativeMarking,
  }) {
    final correctOptionIds = (question['options'] as List)
        .where((opt) => opt['is_correct'] == true)
        .map((opt) => opt['id'] as String)
        .toSet();

    final selectedSet = selectedOptionIds.toSet();

    if (correctOptionIds.difference(selectedSet).isEmpty &&
        selectedSet.difference(correctOptionIds).isEmpty) {
      return (question['points'] as num).toDouble();
    } else {
      return negativeMarking
          ? -(question['points'] as num).toDouble() * 0.25
          : 0;
    }
  }

  static double scoreNumber({
    required Map<String, dynamic> question,
    required double userAnswer,
    required bool negativeMarking,
  }) {
    final correctAnswer =
        double.parse((question['options'] as List).first['label']);
    final tolerance = question['tolerance_numeric'] ?? 0.0;

    if ((userAnswer - correctAnswer).abs() <= tolerance) {
      return (question['points'] as num).toDouble();
    } else {
      return negativeMarking
          ? -(question['points'] as num).toDouble() * 0.25
          : 0;
    }
  }
}

void main() {
  group('Scoring Utils Tests', () {
    group('MCQ Single Choice', () {
      test('should award full points for correct answer', () {
        final question = {
          'id': 'q1',
          'type': 'mcq_single',
          'points': 2,
          'options': [
            {'id': 'opt1', 'label': 'Answer A', 'is_correct': false},
            {'id': 'opt2', 'label': 'Answer B', 'is_correct': true},
            {'id': 'opt3', 'label': 'Answer C', 'is_correct': false},
          ],
        };

        final score = ScoringUtils.scoreMcqSingle(
          question: question,
          selectedOptionId: 'opt2',
          negativeMarking: false,
        );

        expect(score, 2.0);
      });

      test('should award zero points for wrong answer without negative marking',
          () {
        final question = {
          'id': 'q1',
          'type': 'mcq_single',
          'points': 2,
          'options': [
            {'id': 'opt1', 'label': 'Answer A', 'is_correct': false},
            {'id': 'opt2', 'label': 'Answer B', 'is_correct': true},
            {'id': 'opt3', 'label': 'Answer C', 'is_correct': false},
          ],
        };

        final score = ScoringUtils.scoreMcqSingle(
          question: question,
          selectedOptionId: 'opt1',
          negativeMarking: false,
        );

        expect(score, 0.0);
      });

      test('should deduct points for wrong answer with negative marking', () {
        final question = {
          'id': 'q1',
          'type': 'mcq_single',
          'points': 4,
          'options': [
            {'id': 'opt1', 'label': 'Answer A', 'is_correct': false},
            {'id': 'opt2', 'label': 'Answer B', 'is_correct': true},
            {'id': 'opt3', 'label': 'Answer C', 'is_correct': false},
          ],
        };

        final score = ScoringUtils.scoreMcqSingle(
          question: question,
          selectedOptionId: 'opt1',
          negativeMarking: true,
        );

        expect(score, -1.0); // -4 * 0.25 = -1
      });
    });

    group('MCQ Multiple Choice', () {
      test('should award full points when all correct options are selected',
          () {
        final question = {
          'id': 'q1',
          'type': 'mcq_multi',
          'points': 3,
          'options': [
            {'id': 'opt1', 'label': 'Answer A', 'is_correct': true},
            {'id': 'opt2', 'label': 'Answer B', 'is_correct': false},
            {'id': 'opt3', 'label': 'Answer C', 'is_correct': true},
            {'id': 'opt4', 'label': 'Answer D', 'is_correct': false},
          ],
        };

        final score = ScoringUtils.scoreMcqMulti(
          question: question,
          selectedOptionIds: ['opt1', 'opt3'],
          negativeMarking: false,
        );

        expect(score, 3.0);
      });

      test('should award zero points when some correct options are missing',
          () {
        final question = {
          'id': 'q1',
          'type': 'mcq_multi',
          'points': 3,
          'options': [
            {'id': 'opt1', 'label': 'Answer A', 'is_correct': true},
            {'id': 'opt2', 'label': 'Answer B', 'is_correct': false},
            {'id': 'opt3', 'label': 'Answer C', 'is_correct': true},
            {'id': 'opt4', 'label': 'Answer D', 'is_correct': false},
          ],
        };

        final score = ScoringUtils.scoreMcqMulti(
          question: question,
          selectedOptionIds: ['opt1'], // Missing opt3
          negativeMarking: false,
        );

        expect(score, 0.0);
      });

      test('should award zero points when incorrect options are included', () {
        final question = {
          'id': 'q1',
          'type': 'mcq_multi',
          'points': 3,
          'options': [
            {'id': 'opt1', 'label': 'Answer A', 'is_correct': true},
            {'id': 'opt2', 'label': 'Answer B', 'is_correct': false},
            {'id': 'opt3', 'label': 'Answer C', 'is_correct': true},
            {'id': 'opt4', 'label': 'Answer D', 'is_correct': false},
          ],
        };

        final score = ScoringUtils.scoreMcqMulti(
          question: question,
          selectedOptionIds: ['opt1', 'opt2', 'opt3'], // opt2 is wrong
          negativeMarking: false,
        );

        expect(score, 0.0);
      });
    });

    group('Number Type Questions', () {
      test('should award full points for exact match', () {
        final question = {
          'id': 'q1',
          'type': 'number',
          'points': 2,
          'tolerance_numeric': 0.01,
          'options': [
            {'id': 'opt1', 'label': '3.14', 'is_correct': true},
          ],
        };

        final score = ScoringUtils.scoreNumber(
          question: question,
          userAnswer: 3.14,
          negativeMarking: false,
        );

        expect(score, 2.0);
      });

      test('should award full points for answer within tolerance', () {
        final question = {
          'id': 'q1',
          'type': 'number',
          'points': 2,
          'tolerance_numeric': 0.1,
          'options': [
            {'id': 'opt1', 'label': '3.14', 'is_correct': true},
          ],
        };

        final score = ScoringUtils.scoreNumber(
          question: question,
          userAnswer: 3.15,
          negativeMarking: false,
        );

        expect(score, 2.0);
      });

      test('should award zero points for answer outside tolerance', () {
        final question = {
          'id': 'q1',
          'type': 'number',
          'points': 2,
          'tolerance_numeric': 0.01,
          'options': [
            {'id': 'opt1', 'label': '3.14', 'is_correct': true},
          ],
        };

        final score = ScoringUtils.scoreNumber(
          question: question,
          userAnswer: 3.20,
          negativeMarking: false,
        );

        expect(score, 0.0);
      });

      test('should deduct points for wrong answer with negative marking', () {
        final question = {
          'id': 'q1',
          'type': 'number',
          'points': 4,
          'tolerance_numeric': 0.01,
          'options': [
            {'id': 'opt1', 'label': '3.14', 'is_correct': true},
          ],
        };

        final score = ScoringUtils.scoreNumber(
          question: question,
          userAnswer: 5.0,
          negativeMarking: true,
        );

        expect(score, -1.0);
      });
    });

    group('Edge Cases', () {
      test('should handle zero points correctly', () {
        final question = {
          'id': 'q1',
          'type': 'mcq_single',
          'points': 0,
          'options': [
            {'id': 'opt1', 'label': 'Answer A', 'is_correct': true},
          ],
        };

        final score = ScoringUtils.scoreMcqSingle(
          question: question,
          selectedOptionId: 'opt1',
          negativeMarking: false,
        );

        expect(score, 0.0);
      });

      test('should handle fractional points', () {
        final question = {
          'id': 'q1',
          'type': 'mcq_single',
          'points': 1.5,
          'options': [
            {'id': 'opt1', 'label': 'Answer A', 'is_correct': true},
          ],
        };

        final score = ScoringUtils.scoreMcqSingle(
          question: question,
          selectedOptionId: 'opt1',
          negativeMarking: false,
        );

        expect(score, 1.5);
      });

      test('should handle negative marking with fractional points', () {
        final question = {
          'id': 'q1',
          'type': 'mcq_single',
          'points': 3,
          'options': [
            {'id': 'opt1', 'label': 'Answer A', 'is_correct': true},
            {'id': 'opt2', 'label': 'Answer B', 'is_correct': false},
          ],
        };

        final score = ScoringUtils.scoreMcqSingle(
          question: question,
          selectedOptionId: 'opt2',
          negativeMarking: true,
        );

        expect(score, -0.75); // -3 * 0.25 = -0.75
      });
    });
  });
}
