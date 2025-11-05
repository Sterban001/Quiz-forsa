# Step-by-Step Fix Guide - Visual Instructions

## 🎯 Goal
Fix the True/False labels and set correct answers so students get proper scores (not 0%)

---

## Step 1: Fix True/False Labels in Database (2 minutes)

### What You'll Do:
Run SQL script to add "True" and "False" labels to True/False questions

### Instructions:

1. **Open Supabase Dashboard**
   ```
   URL: https://supabase.com/dashboard/project/irqphcvvvdrflsgselky
   ```

2. **Navigate to SQL Editor**
   - Look at left sidebar
   - Click on "SQL Editor" (icon looks like `</>`)

3. **Create New Query**
   - Click "+ New query" button (top right)

4. **Copy SQL Script**
   - Open `fix-true-false-labels.sql` on your computer
   - Select ALL text (Ctrl+A)
   - Copy (Ctrl+C)

5. **Paste in SQL Editor**
   - Click in the query editor area
   - Paste (Ctrl+V)

6. **Run the Query**
   - Click "Run" button (bottom right of editor)
   - OR press Ctrl+Enter

7. **Verify Success**
   - You should see results showing:
     ```
     question_id | prompt | option_id | label | is_correct | order_index
     -----------|--------|-----------|-------|------------|-------------
     ...        | ...    | ...       | True  | true/false | 0
     ...        | ...    | ...       | False | true/false | 1
     ```
   - If `label` column shows "True" and "False", it worked! ✅

---

## Step 2: Set Correct Answers in Admin Panel (10 minutes)

### What You'll Do:
Edit each question and mark which answers are correct

### Instructions:

1. **Open Admin Panel**
   ```
   URL: http://localhost:3001
   Email: mdrizvanali01@gmail.com
   Password: Admin123!
   ```

2. **Navigate to Tests**
   - Click "Tests" in left sidebar
   - OR go to: http://localhost:3001/dashboard/tests

3. **Find "Testing 1" Test**
   - Look for test titled "Testing 1"
   - Should see status badge and visibility badge

4. **Click "Edit" Button**
   - Click the blue "Edit" button on the right
   - This opens the test editor page

5. **You'll See a List of Questions**
   - Should show all 6 questions
   - Each has "Edit" and "Delete" buttons

### For Each Question:

#### 6. **Click "Edit" on First Question**
   - Modal/form will appear

#### 7. **Check the Question Type**
   - Look at top of form: "Question Type" dropdown
   - Will say: MCQ Single, MCQ Multi, True/False, etc.

#### 8. **Mark Correct Answer Based on Type:**

   **If MCQ Single or MCQ Multi:**
   - Scroll down to "Answer Options"
   - You'll see checkboxes next to each option
   - Check the box(es) next to the CORRECT answer(s)
   - For MCQ Single: Check ONLY 1 box
   - For MCQ Multi: Check ALL correct boxes

   **If True/False:**
   - Scroll down to "Correct Answer"
   - You'll see two radio buttons:
     ```
     ○ True
     ○ False
     ```
   - Click the circle next to the correct answer
   - It will fill in: ● True (or ● False)

   **If Number:**
   - Scroll down to "Correct Answer"
   - You'll see a number input field
   - Type the correct number (e.g., 3.14)
   - Optionally set tolerance (e.g., 0.1 means ±0.1 is OK)

   **If Short Text or Long Text:**
   - Nothing to do! These require manual grading
   - Just click "Cancel" or move to next question

#### 9. **Click "Save Question"**
   - Blue button at bottom of form
   - Wait for "Saving..." → "Save Question"
   - Form will close

#### 10. **Repeat for All Questions**
   - Click "Edit" on next question
   - Mark correct answer
   - Save
   - Continue until all questions are done

#### 11. **Verify in Question List**
   - After saving, look at the question in the list
   - Correct answers should show with green checkmark: ✓

---

## Step 3: Test the Complete Flow (5 minutes)

### What You'll Do:
Take the test as a student and verify grading works

### Instructions:

1. **Open Student App**
   ```
   URL: http://localhost:3005
   ```

2. **Login as Student**
   - Email: test@student.com (or any email)
   - Password: password123 (or any password, min 6 chars)
   - Click "Login" or "Sign Up"

3. **Find "Testing 1" Test**
   - Should be on the Tests page
   - Look for test titled "Testing 1"
   - Should show: Category, Time Limit, etc.

4. **Click "Start Test"**
   - May need to click test card first
   - Then click "Start Test" or "Begin Test" button

5. **Answer Questions**
   - Question 1: Select an answer, click "Next"
   - Question 2: Select an answer, click "Next"
   - Continue through all 6 questions
   - Try to answer some CORRECTLY and some WRONG
   - This way you can see grading works!

6. **Submit Test**
   - On last question, click "Submit Test"
   - Confirm submission

7. **Check Results**
   - Should redirect to results page
   - **VERIFY:**
     - Score is NOT 0% (unless you got all wrong!)
     - Score shows as percentage (e.g., 67%)
     - Points shown (e.g., 4/6)
     - Green checkmarks for correct answers ✅
     - Red X marks for incorrect answers ❌
     - Pass/Fail status shows correctly

8. **Expected Results:**
   ```
   If you answered 4/6 correctly:
   - Score: 67% (or similar)
   - Points: 4/6
   - Status: Passed or Failed (depends on pass score setting)
   - Individual questions show correct/incorrect
   ```

---

## Step 4: Verify in Admin Panel (2 minutes)

### What You'll Do:
Check that admin sees the same grading

### Instructions:

1. **Go Back to Admin Panel**
   ```
   URL: http://localhost:3001
   ```

2. **Click "Attempts" in Sidebar**
   - OR go to: http://localhost:3001/dashboard/attempts

3. **Find Your Attempt**
   - Look for most recent attempt
   - Should show your student email
   - Shows test name, score, date

4. **Click "View Details"**
   - Blue link on the right

5. **Verify Grading Details**
   - **Check:**
     - Score matches what student saw
     - Correct answers show green ✓
     - Incorrect answers show red ✗
     - Student's answers are displayed
     - Points awarded per question

6. **If Everything Matches: SUCCESS! 🎉**

---

## 🎉 Success Criteria

You'll know it worked when:

### ✅ Checklist:
- [ ] True/False question shows "True" and "False" labels (not empty)
- [ ] Student score is NOT 0% (unless legitimately got all wrong)
- [ ] Correct answers show with green checkmark
- [ ] Incorrect answers show with red X
- [ ] Score percentage makes sense (e.g., 4/6 = 67%)
- [ ] Pass/Fail status is correct
- [ ] Admin view matches student view

---

## 🐛 Troubleshooting

### Problem: "True/False still shows empty options"

**Possible Causes:**
1. SQL script didn't run successfully
2. Browser cache showing old version
3. Wrong test being viewed

**Solutions:**
1. Run SQL script again, check for errors
2. Hard refresh browser: Ctrl+Shift+R (Windows) or Cmd+Shift+R (Mac)
3. Verify you're on the correct test
4. Re-edit the True/False question in admin panel - it will recreate options

---

### Problem: "Still getting 0% score"

**Possible Causes:**
1. Correct answers not saved
2. Answered all questions wrong
3. Grading function error

**Solutions:**
1. Go to View Details page for test - check if correct answers show green
2. Go to admin → Edit test → Edit each question → Verify checkboxes are checked
3. Check browser console (F12) for errors
4. Check Supabase logs for `calculate_attempt_score` errors

---

### Problem: "Checkboxes not staying checked"

**Possible Causes:**
1. Not clicking "Save Question" button
2. Network error during save
3. Browser issue

**Solutions:**
1. After checking boxes, MUST click "Save Question"
2. Check browser console (F12) for network errors
3. Try different browser
4. Check that dev server is running (should be at localhost:3001)

---

### Problem: "Modal won't close after saving"

**Solution:**
- Refresh the page
- Should show updated question in list
- If question shows correctly, the save worked!

---

## 📝 Quick Reference

### Question Type → What to Mark:

| Type | What You See | What to Do |
|------|-------------|-----------|
| MCQ Single | Checkboxes | Check 1 box |
| MCQ Multi | Checkboxes | Check all correct boxes |
| True/False | Radio buttons | Select True or False |
| Number | Number input | Enter correct number |
| Short Text | Text input | Nothing (manual grading) |
| Long Text | Textarea | Nothing (manual grading) |

### Where to Click:

| Task | Where to Click |
|------|---------------|
| Run SQL | Supabase Dashboard → SQL Editor → Run |
| Edit Test | Admin Panel → Tests → Edit |
| Edit Question | Test Editor → Question Card → Edit |
| Save Question | Question Form → Save Question (bottom) |
| Take Test | Student App → Test Card → Start Test |
| View Results | (Auto-redirects after submit) |
| See Attempt | Admin Panel → Attempts → View Details |

---

## ⏱️ Time Estimates

- Step 1 (SQL Fix): 2 minutes
- Step 2 (Mark Answers): 10 minutes (for 6 questions)
- Step 3 (Take Test): 5 minutes
- Step 4 (Verify Admin): 2 minutes

**Total: ~20 minutes**

---

## 🎯 Final Notes

1. **Be Patient** - Save each question before moving to next
2. **Check Your Work** - Look at question list after saving to verify
3. **Test Thoroughly** - Answer some right, some wrong to see grading
4. **Document Issues** - Note any problems you encounter
5. **Have Fun** - You're almost there! 🚀

**After completing these steps, your quiz platform will be fully functional!**

---

**Need Help?**
- Check console logs (F12)
- Review [QUESTION_TYPES_GUIDE.md](QUESTION_TYPES_GUIDE.md)
- Check server terminal for errors
- Verify Supabase connection

**You've got this!** 💪
