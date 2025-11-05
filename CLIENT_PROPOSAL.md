# QUIZ PLATFORM - PROJECT PROPOSAL
## (Excluding Mobile App)

---

## 1. REQUIREMENTS LIST

### 1.1 Functional Requirements

#### A. Admin Panel (Web Application)
1. **Authentication & Authorization**
   - Secure admin login with email OTP
   - Role-based access control (Admin only)
   - Session management with JWT tokens
   - Secure logout functionality

2. **Dashboard**
   - Overview statistics (total tests, attempts, students, pending reviews)
   - Quick action buttons (Create Test, Manage Tests, View Attempts)
   - Recent tests list with status indicators
   - Real-time data updates

3. **Test Management**
   - Create new tests with comprehensive settings
   - Edit existing tests
   - Clone tests for reuse
   - Delete/Archive tests
   - Publish/Unpublish tests (draft workflow)
   - Test configuration options:
     - Title, description, category, tags
     - Cover image upload
     - Time limits (per-test, per-question, per-section)
     - Visibility settings (public/private/unlisted)
     - Access codes for restricted tests
     - Start and end date/time scheduling
     - Maximum attempts per student
     - Pass score threshold
     - Negative marking configuration
     - Question shuffling option
     - Show/hide correct answers
     - Show/hide explanations

4. **Question Builder**
   - Support for 4 question types:
     - **MCQ Single Choice** (one correct answer, optional negative marking)
     - **MCQ Multiple Choice** (multiple correct answers)
     - **Short Text** (manual grading required)
     - **Number** (with tolerance range)
   - Add/Edit/Delete questions
   - Drag-and-drop question reordering
   - Rich text editor for question prompts
   - Add explanations for answers
   - Set points per question
   - Upload images for questions (optional)

5. **Section Management**
   - Create optional sections within tests
   - Group questions by topics
   - Set section-specific time limits
   - Reorder sections

6. **Analytics Dashboard**
   - Test performance metrics
   - Student engagement statistics
   - Question difficulty analysis
   - Pass/fail rates
   - Average scores and time taken
   - Visual charts and graphs (using Recharts)
   - Filter by date range, test, category

7. **Manual Grading Interface**
   - List of all short-text answers pending review
   - View student responses alongside correct answers
   - Award points with feedback comments
   - Bulk grading actions

8. **Student Management**
   - View all registered students
   - Student profiles with attempt history
   - Whitelist management for private tests
   - Grant/revoke test access

9. **Results & Reporting**
   - View all test attempts
   - Detailed attempt view (question-by-question)
   - Filter by test, student, date, status
   - Export results to CSV
   - Leaderboard display

10. **Settings**
    - Admin profile management
    - System configuration

#### B. Student Web Portal
1. **Authentication**
   - Student signup with email
   - Login with email/password or OTP
   - Password reset functionality
   - Email verification

2. **Test Discovery**
   - Browse all published tests
   - Search tests by title, category, tags
   - Filter by category, difficulty
   - View test details before starting

3. **Test Taking Interface**
   - Single question view with clear navigation
   - Timer display (countdown)
   - Progress indicator (X of Y questions)
   - Mark for review functionality
   - Auto-save answers (every 30 seconds)
   - Auto-submit on timeout
   - Warning before submission

4. **Question Rendering**
   - Display all 4 question types correctly
   - Radio buttons for MCQ single
   - Checkboxes for MCQ multiple
   - Text input for short text
   - Number input for numeric answers

5. **Results Display**
   - Immediate score for auto-graded questions
   - Show correct/incorrect answers (if enabled by admin)
   - Display explanations (if enabled)
   - Show "Pending Review" for manual-graded questions
   - Pass/fail indication
   - Download certificate (if passed)

6. **Attempt History**
   - List of all past attempts
   - View previous scores
   - Review past answers (if allowed)
   - Retake tests (if attempts remaining)

7. **Profile Management**
   - Edit display name
   - Upload profile picture
   - View test statistics
   - Change password

### 1.2 Technical Requirements

#### A. Database (Supabase/PostgreSQL)
1. **Schema Design**
   - 9 core tables: profiles, tests, sections, questions, question_options, attempts, attempt_answers, test_whitelist, leaderboards
   - Proper relationships with foreign keys
   - Indexes on frequently queried columns
   - UUID primary keys
   - Timestamp columns (created_at, updated_at)

2. **Row Level Security (RLS)**
   - Policies for all tables
   - Users can only access their own data
   - Admins have full access
   - Server-side security enforcement

3. **Database Functions**
   - `is_test_available_to_user()` - Check test accessibility
   - `calculate_attempt_score()` - Server-side scoring
   - Automatic timestamp updates (triggers)

4. **Database Views**
   - `test_statistics` - Analytics aggregation
   - `question_difficulty` - Performance analysis

#### B. Admin Panel Technology Stack
- **Framework:** Next.js 14 (App Router, React 18)
- **Language:** TypeScript (strict mode)
- **Styling:** Tailwind CSS 3.4
- **UI Components:** shadcn/ui (based on Radix UI)
- **Backend:** Supabase (Auth, Database, Storage)
- **Form Management:** React Hook Form
- **Validation:** Zod
- **Charts:** Recharts 2.12
- **Icons:** Lucide React
- **State Management:** Zustand (if needed)
- **Date Handling:** date-fns

#### C. Student Portal Technology Stack
- Same as Admin Panel (shared codebase with different routes)

#### D. Hosting & Infrastructure
- **Admin Panel Hosting:** Vercel (recommended)
- **Student Portal Hosting:** Vercel (separate deployment)
- **Database Hosting:** Supabase Cloud
- **Storage:** Supabase Storage (for images)
- **CDN:** Automatic via Vercel
- **SSL/HTTPS:** Automatic (Vercel + Supabase)

#### E. Security Requirements
- Server-side validation for all inputs
- XSS protection (React built-in)
- SQL injection prevention (Supabase parameterized queries)
- CSRF protection (Next.js built-in)
- Rate limiting on sensitive endpoints
- Secure environment variable management

#### F. Performance Requirements
- Page load time < 2 seconds
- API response time < 500ms
- Support 1000+ concurrent users
- Lazy loading for long lists
- Optimistic UI updates
- Caching strategy for frequently accessed data

### 1.3 Non-Functional Requirements

1. **Scalability**
   - Handle 10,000+ students
   - Support 1,000+ tests
   - 100,000+ test attempts
   - Horizontal scaling capability

2. **Reliability**
   - 99.9% uptime
   - Automatic backups (daily)
   - Data redundancy
   - Error logging and monitoring

3. **Usability**
   - Intuitive admin interface
   - Mobile-responsive design (works on tablets/phones)
   - Accessibility (WCAG 2.1 AA compliance)

4. **Maintainability**
   - Clean code architecture
   - Comprehensive documentation
   - Type-safe codebase

---

## 2. DELIVERABLES LIST

### 2.1 Database & Backend
- ✅ Complete PostgreSQL database schema (9 tables)
- ✅ Database migrations SQL files
- ✅ Row Level Security (RLS) policies
- ✅ Database functions and triggers
- ✅ Database views for analytics
- ✅ Seed data for testing
- ✅ Supabase project configuration

### 2.2 Admin Panel Application
- ✅ Next.js 14 project structure
- ✅ TypeScript configuration (strict mode)
- ✅ Tailwind CSS setup
- ✅ shadcn/ui component library integration
- ✅ Supabase authentication setup
- ✅ Admin login page (OTP + Password)
- ✅ Protected dashboard layout with navigation
- ✅ Dashboard home page with statistics
- ✅ Test listing page with filters
- ✅ Test creation form with all settings
- ✅ Test editing interface
- ✅ Question builder with 4 question types
- ✅ Drag-and-drop question reordering
- ✅ Section management interface
- ✅ Analytics dashboard with charts
- ✅ Manual grading interface
- ✅ Student management pages
- ✅ Attempt viewing pages
- ✅ CSV export functionality
- ✅ Test cloning feature
- ✅ Whitelist management
- ✅ Settings page
- ✅ Error handling and loading states
- ✅ Responsive design (mobile-friendly)
- ✅ All UI components (button, input, dialog, etc.)

### 2.3 Student Web Portal
- ✅ Next.js 14 project structure
- ✅ Student signup/login pages
- ✅ Test discovery homepage
- ✅ Search and filter functionality
- ✅ Test details page
- ✅ Test taking interface
- ✅ Timer implementation
- ✅ Auto-save functionality
- ✅ Results display page
- ✅ Attempt history page
- ✅ Student profile page
- ✅ Certificate download (PDF)
- ✅ Responsive design

### 2.4 Deployment & DevOps
- ✅ Vercel deployment configuration (admin panel)
- ✅ Vercel deployment configuration (student portal)
- ✅ Environment variable setup
- ✅ Production build optimization
- ✅ Database backup strategy

### 2.5 Documentation
- ✅ README.md - Project overview
- ✅ IMPLEMENTATION_GUIDE.md - Setup instructions
- ✅ DEPLOYMENT_GUIDE.md - Production deployment
- ✅ ADMIN_GUIDE.md - Admin user manual
- ✅ DATABASE_SCHEMA.md - Database documentation
- ✅ TROUBLESHOOTING.md - Common issues

### 2.6 Testing
- ✅ Unit tests for critical functions
- ✅ Integration tests for API endpoints
- ✅ Test data and fixtures

### 2.7 Training & Handoff
- ✅ Video tutorial (admin panel usage - 1 video)
- ✅ Admin user manual (PDF)
- ✅ Quick reference guide

---

## 3. COSTING BREAKDOWN (INR)

### Phase 1: Database & Backend Development
| Item | Description | Time (hrs) | Rate (₹/hr) | Cost (₹) |
|------|-------------|------------|-------------|----------|
| Database Schema Design | Design 9 tables with relationships | 6 | 1,500 | 9,000 |
| RLS Policies | Implement Row Level Security | 4 | 1,500 | 6,000 |
| Database Functions | Scoring, availability checks | 3 | 1,500 | 4,500 |
| Database Views | Analytics views | 2 | 1,500 | 3,000 |
| Migrations & Seeding | SQL migrations + seed data | 2 | 1,500 | 3,000 |
| Supabase Setup | Project configuration | 1 | 1,500 | 1,500 |
| **Phase 1 Subtotal** | | **18** | | **27,000** |

### Phase 2: Admin Panel Development
| Item | Description | Time (hrs) | Rate (₹/hr) | Cost (₹) |
|------|-------------|------------|-------------|----------|
| Project Setup | Next.js 14, TypeScript, Tailwind | 3 | 1,500 | 4,500 |
| UI Components Setup | shadcn/ui integration (15 components) | 4 | 1,500 | 6,000 |
| Authentication | Login, OTP, role check, middleware | 6 | 1,500 | 9,000 |
| Dashboard Layout | Navigation, header, responsive layout | 4 | 1,500 | 6,000 |
| Dashboard Home | Statistics cards, recent tests | 4 | 1,500 | 6,000 |
| Test Listing | Table with filters, search, sorting | 6 | 1,500 | 9,000 |
| Test Creation Form | All settings, validation with Zod | 8 | 1,500 | 12,000 |
| Test Editing | Edit form with prefilled data | 5 | 1,500 | 7,500 |
| Question Builder | 4 question types, add/edit/delete | 10 | 1,500 | 15,000 |
| Drag-Drop Reordering | dnd-kit implementation | 4 | 1,500 | 6,000 |
| Section Management | Add/edit/delete sections | 4 | 1,500 | 6,000 |
| Image Upload | Test covers, Supabase Storage | 3 | 1,500 | 4,500 |
| Analytics Dashboard | Charts with Recharts, statistics | 6 | 1,500 | 9,000 |
| Manual Grading | Grading interface, bulk actions | 5 | 1,500 | 7,500 |
| Student Management | List, profiles, whitelist | 4 | 1,500 | 6,000 |
| Attempt Viewing | List attempts, detailed view | 4 | 1,500 | 6,000 |
| CSV Export | Results export functionality | 2 | 1,500 | 3,000 |
| Test Cloning | Clone test with all questions | 2 | 1,500 | 3,000 |
| Settings Page | Admin profile, preferences | 2 | 1,500 | 3,000 |
| Error Handling | Toast notifications, error states | 3 | 1,500 | 4,500 |
| **Phase 2 Subtotal** | | **89** | | **133,500** |

### Phase 3: Student Web Portal
| Item | Description | Time (hrs) | Rate (₹/hr) | Cost (₹) |
|------|-------------|------------|-------------|----------|
| Project Setup | Separate Next.js project | 2 | 1,500 | 3,000 |
| Student Authentication | Signup, login, password reset | 5 | 1,500 | 7,500 |
| Homepage | Browse tests, search, filters | 6 | 1,500 | 9,000 |
| Test Details Page | Show test info before starting | 3 | 1,500 | 4,500 |
| Test Taking Interface | Single question view, navigation | 8 | 1,500 | 12,000 |
| Timer Implementation | Countdown, warnings, auto-submit | 4 | 1,500 | 6,000 |
| Auto-Save Functionality | Save answers every 30s | 3 | 1,500 | 4,500 |
| Question Rendering | All 4 types correctly displayed | 5 | 1,500 | 7,500 |
| Results Display | Score, correct answers, explanations | 5 | 1,500 | 7,500 |
| Attempt History | List past attempts, review | 4 | 1,500 | 6,000 |
| Student Profile | Edit profile, stats, avatar | 4 | 1,500 | 6,000 |
| Certificate Download | PDF generation | 3 | 1,500 | 4,500 |
| **Phase 3 Subtotal** | | **52** | | **78,000** |

### Phase 4: Testing & Quality Assurance
| Item | Description | Time (hrs) | Rate (₹/hr) | Cost (₹) |
|------|-------------|------------|-------------|----------|
| Unit Testing | Critical function tests | 4 | 1,200 | 4,800 |
| Integration Testing | API endpoint tests | 4 | 1,200 | 4,800 |
| Bug Fixing | Issues found during testing | 6 | 1,500 | 9,000 |
| Performance Optimization | Load time, query optimization | 3 | 1,500 | 4,500 |
| Cross-browser Testing | Chrome, Firefox, Safari, Edge | 2 | 1,200 | 2,400 |
| Mobile Testing | iPad, tablets, phones | 2 | 1,200 | 2,400 |
| **Phase 4 Subtotal** | | **21** | | **27,900** |

### Phase 5: Deployment & DevOps
| Item | Description | Time (hrs) | Rate (₹/hr) | Cost (₹) |
|------|-------------|------------|-------------|----------|
| Vercel Setup (Admin) | Production deployment | 2 | 1,500 | 3,000 |
| Vercel Setup (Student) | Production deployment | 2 | 1,500 | 3,000 |
| Environment Config | Production environment variables | 1 | 1,500 | 1,500 |
| Domain Setup | Custom domain configuration | 1 | 1,500 | 1,500 |
| Database Backup | Automated backup configuration | 2 | 1,500 | 3,000 |
| **Phase 5 Subtotal** | | **8** | | **12,000** |

### Phase 6: Documentation & Training
| Item | Description | Time (hrs) | Rate (₹/hr) | Cost (₹) |
|------|-------------|------------|-------------|----------|
| Technical Documentation | README, guides (6 docs) | 4 | 1,200 | 4,800 |
| Admin User Manual | Comprehensive admin guide | 3 | 1,200 | 3,600 |
| Video Tutorial | Screen recording (1 video) | 2 | 1,200 | 2,400 |
| Handoff Session | Knowledge transfer (1 hour) | 1 | 1,500 | 1,500 |
| **Phase 6 Subtotal** | | **10** | | **12,300** |

---

## TOTAL PROJECT COST SUMMARY

| Phase | Hours | Cost (₹) | % of Total |
|-------|-------|----------|------------|
| **Phase 1: Database & Backend** | 18 | 27,000 | 9.2% |
| **Phase 2: Admin Panel** | 89 | 133,500 | 45.6% |
| **Phase 3: Student Portal** | 52 | 78,000 | 26.6% |
| **Phase 4: Testing & QA** | 21 | 27,900 | 9.5% |
| **Phase 5: Deployment & DevOps** | 8 | 12,000 | 4.1% |
| **Phase 6: Documentation & Training** | 10 | 12,300 | 4.2% |
| **SUBTOTAL** | **198** | **290,700** | **99.2%** |
| **Contingency (2.8%)** | **6** | **9,300** | **0.8%** |

### **TOTAL PROJECT COST: ₹3,00,000**
### **Converted: $3,600 USD (approx)**

---

## 4. INFRASTRUCTURE COSTS (Monthly - Client Responsibility)

| Service | Plan | Monthly Cost (₹) | Annual Cost (₹) |
|---------|------|------------------|-----------------|
| **Supabase** | Free tier (500MB DB) | ₹0 | ₹0 |
| **Vercel** (Both apps) | Hobby plan | ₹0 | ₹0 |
| **Domain Name** (.com) | Annual registration | ₹100 | ₹1,200 |
| **TOTAL MONTHLY (Development)** | | **₹100** | **₹1,200** |

**Production Upgrade (Recommended):**
| Service | Plan | Monthly Cost (₹) |
|---------|------|------------------|
| **Supabase Pro** | 8GB DB, 100GB storage | ₹2,100 |
| **Vercel Pro** | Unlimited bandwidth | ₹1,700 |
| **TOTAL MONTHLY (Production)** | | **₹3,800** |

**Note:** Can start with free tier, upgrade only when needed (100+ active users).

---

## 5. PAYMENT SCHEDULE

| Milestone | Deliverable | % of Total | Amount (₹) |
|-----------|-------------|------------|------------|
| **Project Kickoff** | Contract signed, requirements finalized | 30% | ₹90,000 |
| **Phase 1-2 Complete** | Database + Admin Panel working | 40% | ₹1,20,000 |
| **Phase 3-4 Complete** | Student Portal + Testing | 20% | ₹60,000 |
| **Final Delivery** | Deployment, documentation, handoff | 10% | ₹30,000 |
| **TOTAL** | | **100%** | **₹3,00,000** |

---

## 6. TIMELINE

| Phase | Duration | Dependencies |
|-------|----------|--------------|
| **Phase 1: Database** | Week 1 | None |
| **Phase 2: Admin Panel** | Week 2-4 | Phase 1 complete |
| **Phase 3: Student Portal** | Week 4-6 | Phase 1 complete |
| **Phase 4: Testing** | Week 6-7 | Phase 2-3 complete |
| **Phase 5: Deployment** | Week 7 | Phase 4 complete |
| **Phase 6: Documentation** | Week 7-8 | All phases complete |
| **TOTAL PROJECT DURATION** | **8 weeks** | **(2 months)** |

---

## 7. ASSUMPTIONS

1. Client provides Supabase account credentials (free tier acceptable)
2. Client provides domain name (or we register on their behalf - ₹1,200 extra)
3. All content (test questions, images) provided by client
4. Single language (English) - multi-language is additional cost
5. Standard UI design - custom branding included
6. Client available for weekly status meetings (30 min)
7. Feedback provided within 48 hours of milestone delivery
8. No third-party API integrations (payment gateways, etc.)
9. Testing on modern browsers only (Chrome, Firefox, Safari, Edge)
10. Mobile-responsive web, not native mobile apps

---

## 8. EXCLUSIONS

The following are **NOT** included in this proposal:
- Flutter mobile app development
- iOS/Android app store submissions
- Native mobile applications
- Payment gateway integration
- Advanced analytics beyond basic stats
- SMS notifications (email only)
- Video question support
- Live proctoring features
- WhatsApp/Telegram bot integration
- Custom API for third-party integrations
- Ongoing maintenance (30-day warranty included, extended support available separately)

---

## 9. POST-LAUNCH SUPPORT OPTIONS (Optional)

### Option A: Basic Support - ₹5,000/month
- 3 hours/month support
- Bug fixes only
- Email support (48hr response)

### Option B: Standard Support - ₹10,000/month
- 6 hours/month support
- Bug fixes + minor enhancements
- Email support (24hr response)
- Monthly maintenance

### Option C: Premium Support - ₹20,000/month
- 12 hours/month support
- Bug fixes + enhancements + new features
- Priority email support (12hr response)
- Bi-weekly check-ins

**Note:** 30-day warranty (bug fixes) included free after project delivery.

---

## 10. NEXT STEPS

1. **Review this proposal** - Go through requirements and deliverables
2. **Schedule discussion** - Clarify any questions or modifications
3. **Sign agreement** - Finalize contract and scope
4. **Make advance payment** - 30% to begin development
5. **Kickoff meeting** - Project planning and timeline confirmation
6. **Development begins** - Weekly updates and milestone deliveries

---

**This proposal is valid for 30 days from the date issued.**

**Project Cost: ₹3,00,000 (Three Lakh Rupees Only)**

---

## CONTACT INFORMATION

For questions or to proceed with this project:

- **Developer:** [Your Name]
- **Email:** [your-email@example.com]
- **Phone:** +91-XXXXX-XXXXX
- **Portfolio:** [your-portfolio-url]

---

*Prepared on: [Current Date]*
*Proposal Version: 1.0*
