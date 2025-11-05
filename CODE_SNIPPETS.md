# Useful Code Snippets

Common code patterns and snippets you'll need while implementing.

## Supabase Queries

### Fetch Tests with Questions
```typescript
// Admin Panel
const { data, error } = await supabase
  .from('tests')
  .select(`
    *,
    questions (
      *,
      question_options (*)
    ),
    sections (*)
  `)
  .eq('id', testId)
  .single()
```

```dart
// Flutter
final response = await supabase
  .from('tests')
  .select('*, questions(*,question_options(*)), sections(*)')
  .eq('id', testId)
  .single();
```

### Create Test with Questions
```typescript
// Admin Panel
const { data: test } = await supabase
  .from('tests')
  .insert({
    title: 'My Test',
    status: 'draft',
    created_by: user.id,
  })
  .select()
  .single()

// Then insert questions
for (const question of questions) {
  const { data: q } = await supabase
    .from('questions')
    .insert({
      test_id: test.id,
      ...question,
    })
    .select()
    .single()

  // Insert options
  for (const option of question.options) {
    await supabase
      .from('question_options')
      .insert({
        question_id: q.id,
        ...option,
      })
  }
}
```

### Submit Attempt and Calculate Score
```typescript
// Update attempt
await supabase
  .from('attempts')
  .update({
    submitted_at: new Date().toISOString(),
    duration_seconds: duration,
    status: 'submitted',
  })
  .eq('id', attemptId)

// Insert answers
await supabase
  .from('attempt_answers')
  .upsert(answers)

// Calculate score
await supabase.rpc('calculate_attempt_score', {
  attempt_id_param: attemptId,
})
```

### Get User Attempts
```typescript
const { data } = await supabase
  .from('attempts')
  .select(`
    *,
    tests (
      title,
      category,
      pass_score
    )
  `)
  .eq('user_id', userId)
  .order('created_at', { ascending: false })
```

## React Components (Admin Panel)

### Loading State
```tsx
import { Loader2 } from 'lucide-react'

function LoadingSpinner() {
  return (
    <div className="flex items-center justify-center p-8">
      <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
    </div>
  )
}
```

### Error State
```tsx
function ErrorMessage({ message }: { message: string }) {
  return (
    <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
      <p className="font-medium">Error</p>
      <p className="text-sm">{message}</p>
    </div>
  )
}
```

### Empty State
```tsx
import { FileQuestion } from 'lucide-react'

function EmptyState({
  title,
  description,
  action
}: {
  title: string
  description: string
  action?: React.ReactNode
}) {
  return (
    <div className="text-center py-12">
      <FileQuestion className="mx-auto h-12 w-12 text-gray-400" />
      <h3 className="mt-2 text-sm font-medium text-gray-900">{title}</h3>
      <p className="mt-1 text-sm text-gray-500">{description}</p>
      {action && <div className="mt-6">{action}</div>}
    </div>
  )
}
```

### Form with Validation (React Hook Form + Zod)
```tsx
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'

const testSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters'),
  description: z.string().optional(),
  category: z.string().optional(),
  time_limit_minutes: z.number().min(1).optional(),
  pass_score: z.number().min(0).max(100),
})

type TestFormData = z.infer<typeof testSchema>

function TestForm() {
  const form = useForm<TestFormData>({
    resolver: zodResolver(testSchema),
    defaultValues: {
      title: '',
      pass_score: 70,
    },
  })

  const onSubmit = async (data: TestFormData) => {
    // Handle submission
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)}>
      <input {...form.register('title')} />
      {form.formState.errors.title && (
        <p className="text-red-600 text-sm">
          {form.formState.errors.title.message}
        </p>
      )}
      {/* More fields */}
      <button type="submit" disabled={form.formState.isSubmitting}>
        {form.formState.isSubmitting ? 'Saving...' : 'Save'}
      </button>
    </form>
  )
}
```

## Flutter Widgets

### Riverpod Provider Example
```dart
import 'package:flutter_riverpod/flutter_riverpod.dart';

// Provider
final testsProvider = FutureProvider<List<Test>>((ref) async {
  final repository = ref.read(testRepositoryProvider);
  return await repository.getAvailableTests();
});

// Consumer
class TestsList extends ConsumerWidget {
  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final testsAsync = ref.watch(testsProvider);

    return testsAsync.when(
      data: (tests) => ListView.builder(
        itemCount: tests.length,
        itemBuilder: (context, index) => TestCard(test: tests[index]),
      ),
      loading: () => Center(child: CircularProgressIndicator()),
      error: (error, stack) => ErrorWidget(error.toString()),
    );
  }
}
```

### Countdown Timer
```dart
import 'dart:async';
import 'package:flutter/material.dart';

class CountdownTimer extends StatefulWidget {
  final int durationSeconds;
  final VoidCallback onTimerEnd;

  const CountdownTimer({
    required this.durationSeconds,
    required this.onTimerEnd,
  });

  @override
  State<CountdownTimer> createState() => _CountdownTimerState();
}

class _CountdownTimerState extends State<CountdownTimer> {
  late int _remainingSeconds;
  Timer? _timer;

  @override
  void initState() {
    super.initState();
    _remainingSeconds = widget.durationSeconds;
    _startTimer();
  }

  void _startTimer() {
    _timer = Timer.periodic(Duration(seconds: 1), (timer) {
      if (_remainingSeconds > 0) {
        setState(() {
          _remainingSeconds--;
        });
      } else {
        timer.cancel();
        widget.onTimerEnd();
      }
    });
  }

  @override
  void dispose() {
    _timer?.cancel();
    super.dispose();
  }

  String _formatTime(int seconds) {
    final minutes = seconds ~/ 60;
    final secs = seconds % 60;
    return '${minutes.toString().padLeft(2, '0')}:${secs.toString().padLeft(2, '0')}';
  }

  @override
  Widget build(BuildContext context) {
    final isLowTime = _remainingSeconds < 60;

    return Container(
      padding: EdgeInsets.symmetric(horizontal: 16, vertical: 8),
      decoration: BoxDecoration(
        color: isLowTime ? Colors.red.shade50 : Colors.blue.shade50,
        borderRadius: BorderRadius.circular(20),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(
            Icons.timer,
            size: 20,
            color: isLowTime ? Colors.red : Colors.blue,
          ),
          SizedBox(width: 4),
          Text(
            _formatTime(_remainingSeconds),
            style: TextStyle(
              fontSize: 16,
              fontWeight: FontWeight.bold,
              color: isLowTime ? Colors.red : Colors.blue.shade900,
            ),
          ),
        ],
      ),
    );
  }
}
```

### MCQ Question Widget
```dart
class McqQuestion extends StatefulWidget {
  final Question question;
  final String? selectedAnswer;
  final Function(String) onAnswerSelected;

  const McqQuestion({
    required this.question,
    this.selectedAnswer,
    required this.onAnswerSelected,
  });

  @override
  State<McqQuestion> createState() => _McqQuestionState();
}

class _McqQuestionState extends State<McqQuestion> {
  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          widget.question.prompt,
          style: TextStyle(fontSize: 18, fontWeight: FontWeight.w500),
        ),
        SizedBox(height: 16),
        ...widget.question.questionOptions.map((option) {
          final isSelected = widget.selectedAnswer == option.id;

          return GestureDetector(
            onTap: () => widget.onAnswerSelected(option.id),
            child: Container(
              margin: EdgeInsets.only(bottom: 12),
              padding: EdgeInsets.all(16),
              decoration: BoxDecoration(
                border: Border.all(
                  color: isSelected ? Colors.blue : Colors.grey.shade300,
                  width: isSelected ? 2 : 1,
                ),
                borderRadius: BorderRadius.circular(8),
                color: isSelected ? Colors.blue.shade50 : Colors.white,
              ),
              child: Row(
                children: [
                  Container(
                    width: 24,
                    height: 24,
                    decoration: BoxDecoration(
                      shape: BoxShape.circle,
                      border: Border.all(
                        color: isSelected ? Colors.blue : Colors.grey,
                        width: 2,
                      ),
                      color: isSelected ? Colors.blue : Colors.transparent,
                    ),
                    child: isSelected
                        ? Icon(Icons.check, size: 16, color: Colors.white)
                        : null,
                  ),
                  SizedBox(width: 12),
                  Expanded(
                    child: Text(
                      option.label,
                      style: TextStyle(fontSize: 16),
                    ),
                  ),
                ],
              ),
            ),
          );
        }).toList(),
      ],
    );
  }
}
```

### Loading Skeleton
```dart
import 'package:shimmer/shimmer.dart';

class TestCardSkeleton extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return Shimmer.fromColors(
      baseColor: Colors.grey.shade300,
      highlightColor: Colors.grey.shade100,
      child: Card(
        child: Padding(
          padding: EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Container(
                width: double.infinity,
                height: 20,
                color: Colors.white,
              ),
              SizedBox(height: 8),
              Container(
                width: 150,
                height: 16,
                color: Colors.white,
              ),
              SizedBox(height: 12),
              Container(
                width: 100,
                height: 16,
                color: Colors.white,
              ),
            ],
          ),
        ),
      ),
    );
  }
}
```

### Retry Widget
```dart
class RetryWidget extends StatelessWidget {
  final String message;
  final VoidCallback onRetry;

  const RetryWidget({
    required this.message,
    required this.onRetry,
  });

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(Icons.error_outline, size: 64, color: Colors.grey),
          SizedBox(height: 16),
          Text(
            message,
            textAlign: TextAlign.center,
            style: TextStyle(fontSize: 16, color: Colors.grey.shade700),
          ),
          SizedBox(height: 24),
          ElevatedButton.icon(
            onPressed: onRetry,
            icon: Icon(Icons.refresh),
            label: Text('Retry'),
          ),
        ],
      ),
    );
  }
}
```

## Utility Functions

### Date Formatting (TypeScript)
```typescript
export function formatDate(date: string | Date): string {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(new Date(date))
}

export function formatRelativeTime(date: string | Date): string {
  const now = new Date()
  const then = new Date(date)
  const diffInSeconds = Math.floor((now.getTime() - then.getTime()) / 1000)

  if (diffInSeconds < 60) return 'just now'
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`
  if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`

  return formatDate(date)
}
```

### Date Formatting (Dart)
```dart
import 'package:intl/intl.dart';

String formatDate(DateTime date) {
  return DateFormat('MMM dd, yyyy').format(date);
}

String formatDateTime(DateTime date) {
  return DateFormat('MMM dd, yyyy HH:mm').format(date);
}

String formatDuration(int seconds) {
  final duration = Duration(seconds: seconds);
  final hours = duration.inHours;
  final minutes = duration.inMinutes.remainder(60);
  final secs = duration.inSeconds.remainder(60);

  if (hours > 0) {
    return '${hours}h ${minutes}m ${secs}s';
  } else if (minutes > 0) {
    return '${minutes}m ${secs}s';
  } else {
    return '${secs}s';
  }
}
```

### Check Network Connectivity (Flutter)
```dart
import 'package:connectivity_plus/connectivity_plus.dart';

Future<bool> isOnline() async {
  final connectivityResult = await Connectivity().checkConnectivity();
  return connectivityResult.any((result) => result != ConnectivityResult.none);
}

Stream<bool> onlineStatusStream() {
  return Connectivity().onConnectivityChanged.map((results) {
    return results.any((result) => result != ConnectivityResult.none);
  });
}
```

### Debounce (Search)
```dart
import 'dart:async';

class Debouncer {
  final int milliseconds;
  Timer? _timer;

  Debouncer({required this.milliseconds});

  void run(VoidCallback action) {
    _timer?.cancel();
    _timer = Timer(Duration(milliseconds: milliseconds), action);
  }

  void dispose() {
    _timer?.cancel();
  }
}

// Usage
final searchDebouncer = Debouncer(milliseconds: 500);

void onSearchChanged(String query) {
  searchDebouncer.run(() {
    // Perform search
    performSearch(query);
  });
}
```

## SQL Queries

### Get Test Statistics
```sql
SELECT
  t.id,
  t.title,
  COUNT(DISTINCT a.id) as total_attempts,
  COUNT(DISTINCT a.user_id) as unique_users,
  AVG(CASE WHEN a.status = 'submitted' THEN a.score END) as avg_score,
  COUNT(CASE WHEN a.status = 'submitted' AND a.score >= t.pass_score THEN 1 END)::FLOAT /
    NULLIF(COUNT(CASE WHEN a.status = 'submitted' THEN 1 END), 0) * 100 as pass_rate
FROM tests t
LEFT JOIN attempts a ON t.id = a.test_id
WHERE t.id = $1
GROUP BY t.id;
```

### Get Question Difficulty
```sql
SELECT
  q.id,
  q.prompt,
  COUNT(aa.id) as total_responses,
  COUNT(CASE WHEN aa.is_correct = true THEN 1 END) as correct_responses,
  COUNT(CASE WHEN aa.is_correct = true THEN 1 END)::FLOAT /
    NULLIF(COUNT(aa.id), 0) * 100 as correct_percentage
FROM questions q
LEFT JOIN attempt_answers aa ON q.id = aa.question_id
WHERE q.test_id = $1
GROUP BY q.id;
```

### Get User Leaderboard
```sql
SELECT
  p.display_name,
  l.best_score,
  l.best_time_seconds,
  l.attempt_count
FROM leaderboards l
JOIN profiles p ON l.user_id = p.id
WHERE l.test_id = $1
ORDER BY l.best_score DESC, l.best_time_seconds ASC
LIMIT 10;
```

## Environment Setup

### .env.local (Admin Panel)
```bash
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJxxxxx...
```

### Run Commands with Environment (Flutter)
```bash
# Development
flutter run \
  --dart-define=SUPABASE_URL=https://xxxxx.supabase.co \
  --dart-define=SUPABASE_ANON_KEY=eyJxxxxx...

# Production Build
flutter build apk --release \
  --dart-define=SUPABASE_URL=https://xxxxx.supabase.co \
  --dart-define=SUPABASE_ANON_KEY=eyJxxxxx...
```

## Common Patterns

### Optimistic Updates (Riverpod)
```dart
final testsProvider = StateNotifierProvider<TestsNotifier, AsyncValue<List<Test>>>((ref) {
  return TestsNotifier(ref.read(testRepositoryProvider));
});

class TestsNotifier extends StateNotifier<AsyncValue<List<Test>>> {
  final TestRepository _repository;

  TestsNotifier(this._repository) : super(const AsyncValue.loading()) {
    loadTests();
  }

  Future<void> loadTests() async {
    state = const AsyncValue.loading();
    state = await AsyncValue.guard(() => _repository.getAvailableTests());
  }

  Future<void> deleteTest(String testId) async {
    final previousState = state;

    // Optimistically update UI
    state = state.whenData((tests) => tests.where((t) => t.id != testId).toList());

    try {
      await _repository.deleteTest(testId);
    } catch (e) {
      // Revert on error
      state = previousState;
      rethrow;
    }
  }
}
```

### Pull to Refresh
```dart
Future<void> _handleRefresh() async {
  ref.invalidate(testsProvider);
  await ref.read(testsProvider.future);
}

RefreshIndicator(
  onRefresh: _handleRefresh,
  child: TestsList(),
)
```

These snippets should cover most common scenarios you'll encounter!
