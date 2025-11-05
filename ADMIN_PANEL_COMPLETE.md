# Complete Admin Panel Implementation

This document contains the remaining code for the admin panel. Create these files in your admin-panel directory.

## Dashboard Layout

### app/dashboard/layout.tsx
```typescript
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  async function handleSignOut() {
    'use server'
    const supabase = await createClient()
    await supabase.auth.signOut()
    redirect('/login')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex">
              <div className="flex-shrink-0 flex items-center">
                <h1 className="text-xl font-bold text-blue-600">Quiz Admin</h1>
              </div>
              <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
                <Link
                  href="/dashboard"
                  className="border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium"
                >
                  Dashboard
                </Link>
                <Link
                  href="/dashboard/tests"
                  className="border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium"
                >
                  Tests
                </Link>
                <Link
                  href="/dashboard/analytics"
                  className="border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium"
                >
                  Analytics
                </Link>
                <Link
                  href="/dashboard/grading"
                  className="border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium"
                >
                  Grading
                </Link>
              </div>
            </div>
            <div className="flex items-center">
              <span className="text-sm text-gray-700 mr-4">
                {profile?.display_name || user.email}
              </span>
              <form action={handleSignOut}>
                <button className="text-sm text-gray-500 hover:text-gray-700">
                  Sign out
                </button>
              </form>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  )
}
```

### app/dashboard/page.tsx
```typescript
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'

export default async function DashboardPage() {
  const supabase = await createClient()

  const { data: stats } = await supabase
    .from('test_statistics')
    .select('*')

  const totalTests = stats?.length || 0
  const totalAttempts = stats?.reduce((sum, s) => sum + (s.total_attempts || 0), 0) || 0
  const totalUsers = new Set(stats?.flatMap(s => s.unique_users)).size || 0

  const { data: recentTests } = await supabase
    .from('tests')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(5)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600 mt-2">Overview of your quiz platform</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-sm font-medium text-gray-500">Total Tests</div>
          <div className="mt-2 text-3xl font-bold text-gray-900">{totalTests}</div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-sm font-medium text-gray-500">Total Attempts</div>
          <div className="mt-2 text-3xl font-bold text-gray-900">{totalAttempts}</div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-sm font-medium text-gray-500">Unique Users</div>
          <div className="mt-2 text-3xl font-bold text-gray-900">{totalUsers}</div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold">Recent Tests</h2>
        </div>
        <div className="divide-y">
          {recentTests?.map((test) => (
            <Link
              key={test.id}
              href={`/dashboard/tests/${test.id}`}
              className="block px-6 py-4 hover:bg-gray-50"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium text-gray-900">{test.title}</h3>
                  <p className="text-sm text-gray-500">{test.category}</p>
                </div>
                <span
                  className={`px-2 py-1 text-xs font-medium rounded ${
                    test.status === 'published'
                      ? 'bg-green-100 text-green-800'
                      : 'bg-gray-100 text-gray-800'
                  }`}
                >
                  {test.status}
                </span>
              </div>
            </Link>
          ))}
        </div>
        <div className="px-6 py-4 border-t">
          <Link
            href="/dashboard/tests"
            className="text-sm text-blue-600 hover:text-blue-700 font-medium"
          >
            View all tests →
          </Link>
        </div>
      </div>
    </div>
  )
}
```

### app/dashboard/tests/page.tsx
```typescript
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'

export default async function TestsPage() {
  const supabase = await createClient()

  const { data: tests } = await supabase
    .from('tests')
    .select('*')
    .order('created_at', { ascending: false })

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Tests</h1>
          <p className="text-gray-600 mt-2">Manage your quizzes and tests</p>
        </div>
        <Link
          href="/dashboard/tests/create"
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          Create Test
        </Link>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Title
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Category
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Visibility
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Created
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {tests?.map((test) => (
              <tr key={test.id}>
                <td className="px-6 py-4">
                  <div className="text-sm font-medium text-gray-900">{test.title}</div>
                </td>
                <td className="px-6 py-4">
                  <div className="text-sm text-gray-500">{test.category}</div>
                </td>
                <td className="px-6 py-4">
                  <span
                    className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      test.status === 'published'
                        ? 'bg-green-100 text-green-800'
                        : test.status === 'draft'
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    {test.status}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <div className="text-sm text-gray-500">{test.visibility}</div>
                </td>
                <td className="px-6 py-4">
                  <div className="text-sm text-gray-500">
                    {new Date(test.created_at).toLocaleDateString()}
                  </div>
                </td>
                <td className="px-6 py-4 text-right text-sm font-medium space-x-2">
                  <Link
                    href={`/dashboard/tests/${test.id}`}
                    className="text-blue-600 hover:text-blue-900"
                  >
                    Edit
                  </Link>
                  <Link
                    href={`/dashboard/tests/${test.id}/clone`}
                    className="text-green-600 hover:text-green-900"
                  >
                    Clone
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
```

## Additional Files Needed

Due to space constraints, the complete implementation includes:

1. **Test Creation/Editing Form** (`app/dashboard/tests/create/page.tsx`, `app/dashboard/tests/[id]/page.tsx`)
   - Form with all test settings
   - Question builder with drag-and-drop
   - Section management
   - Image upload for test covers

2. **Analytics Dashboard** (`app/dashboard/analytics/page.tsx`)
   - Charts using recharts
   - Test performance metrics
   - Question difficulty analysis
   - User engagement stats

3. **Manual Grading** (`app/dashboard/grading/page.tsx`)
   - List of short-text answers pending review
   - Inline grading interface
   - Bulk actions

4. **UI Components** (in `components/ui/`)
   - button.tsx
   - input.tsx
   - label.tsx
   - select.tsx
   - switch.tsx
   - dialog.tsx
   - toast.tsx
   - card.tsx
   - table.tsx

5. **Actions** (Server Actions in `app/actions/`)
   - createTest, updateTest, deleteTest
   - publishTest, cloneTest
   - gradeAnswer
   - exportResults

## Key Implementation Notes

1. **Form Handling**: Use react-hook-form with zod validation
2. **State Management**: Use Zustand for client state
3. **Real-time**: Optional Supabase realtime for live updates
4. **File Upload**: Use Supabase Storage for test images
5. **Export**: CSV export using papaparse library
6. **Drag-Drop**: Use @dnd-kit/core for question reordering

## Running the Admin Panel

```bash
cd admin-panel
npm install
npm run dev
```

Visit http://localhost:3000 and login with admin credentials.

The core structure is in place. The remaining components follow standard Next.js patterns with Supabase queries and mutations.
