# Timekeeping Records Fix Guide

## Problem

The "Today's Timekeeping Records" section in Manager Dashboard → Staff & Timekeeping is showing empty/blank with no data from the Time Clock Terminal.

## Root Cause

The timekeeping records system requires:
1. ✅ `employees` table with active employees
2. ✅ `attendance_records` table to store clock in/out data
3. ✅ Employees must clock in using the Time Clock Terminal
4. ✅ JavaScript must load and fetch the data

## Solution Steps

### Step 1: Run the Diagnostic Test

1. Open your browser and navigate to:
   ```
   http://localhost/pos-jither-main/test-timekeeping.php
   ```

2. This test page will:
   - ✅ Check database connection
   - ✅ Check if `attendance_records` table exists
   - ✅ Create the table if it doesn't exist
   - ✅ Show existing employees
   - ✅ Show any existing attendance records
   - ✅ Provide a link to test the API endpoint

### Step 2: Verify Table Was Created

The diagnostic page will automatically create the `attendance_records` table if it doesn't exist with this structure:

```sql
CREATE TABLE attendance_records (
    id INT PRIMARY KEY AUTO_INCREMENT,
    employee_id INT NOT NULL,
    date DATE NOT NULL,
    time_in DATETIME DEFAULT NULL,
    time_out DATETIME DEFAULT NULL,
    hours_worked DECIMAL(5,2) DEFAULT 0,
    status VARCHAR(20) DEFAULT 'present',
    notes TEXT,
    is_locked BOOLEAN DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE,
    UNIQUE KEY unique_employee_date (employee_id, date)
);
```

### Step 3: Test Clock In/Out

1. Go to the **Time Clock Terminal** (the main page when not logged in)
2. Enter an employee number (e.g., `EMP001`)
3. Click **"Time In"**
4. You should see: "Welcome [Employee Name]! Successfully clocked in at [time]"

### Step 4: Verify Records Appear

1. Log in as **Manager**
2. Go to **Manager Dashboard**
3. Click **"Staff & Timekeeping"** in the sidebar
4. Scroll down to **"Today's Timekeeping Records"**
5. You should now see:
   - Date: Today's date
   - Name: Employee name
   - Role: Employee position
   - Time In: Clock in time
   - Time Out: - (not clocked out yet)
   - Hours Worked: - (not clocked out yet)
   - Status: 🟢 On Time or ⏰ Late

### Step 5: Test Clock Out

1. Go back to **Time Clock Terminal**
2. Enter the same employee number
3. Click **"Time Out"**
4. Go back to Manager → Staff & Timekeeping
5. Now the record should show:
   - Time Out: Clock out time
   - Hours Worked: X.XX hrs
   - Status: ✓ Present

---

## Expected Behavior

### Time Clock Terminal → Database Flow

```
Employee enters number and clocks in
    ↓
php/timekeeping-api.php saves to attendance_records table
    ↓
Record created with:
- employee_id
- date (today)
- time_in (current timestamp)
- time_out (NULL)
- hours_worked (0)
- status ('present' or 'late')
```

### Manager Dashboard → Display Flow

```
Manager opens Staff & Timekeeping tab
    ↓
js/staff-timekeeping.js initializes
    ↓
Calls php/staff-timekeeping-api.php?action=get_all_records&period=today
    ↓
API queries attendance_records JOIN employees
    ↓
Returns JSON with records array
    ↓
JavaScript renders records in table
```

---

## Troubleshooting

### Issue: Table shows "No Records Today"

**Solution:**
1. Check if any employee has clocked in today using the diagnostic page
2. Verify the `attendance_records` table has data:
   ```sql
   SELECT * FROM attendance_records WHERE DATE(date) = CURDATE();
   ```
3. If empty, have an employee clock in via Time Clock Terminal

### Issue: Table shows "Error Loading Records"

**Solution:**
1. Open browser console (F12)
2. Look for error messages
3. Check Network tab for failed API calls
4. Common causes:
   - Database connection error
   - `attendance_records` table doesn't exist
   - PHP errors in `staff-timekeeping-api.php`

### Issue: JavaScript not loading

**Solution:**
1. Open browser console (F12)
2. Check for JavaScript errors
3. Verify `js/staff-timekeeping.js` is loaded:
   - In Network tab, look for `staff-timekeeping.js`
   - Should return 200 status code
4. Ensure you're on the correct tab (Staff & Timekeeping)

### Issue: Records from yesterday/last week not showing

**Solution:**
The default filter shows "Today". To view older records:
1. Use the **date picker** at the top right
2. Select a specific date
3. Or modify the API to include more periods

---

## API Endpoints

### Get Timekeeping Records
```
GET php/staff-timekeeping-api.php?action=get_all_records&period=today
GET php/staff-timekeeping-api.php?action=get_all_records&period=week
GET php/staff-timekeeping-api.php?action=get_all_records&date=2025-12-09
```

**Response:**
```json
{
  "success": true,
  "records": [
    {
      "date": "2025-12-09",
      "time_in": "2025-12-09 08:30:00",
      "time_out": "2025-12-09 17:00:00",
      "hours_worked": "8.50",
      "status": "present",
      "employee_name": "John Doe",
      "employee_number": "EMP001",
      "position": "Barista",
      "department": "Operations"
    }
  ],
  "count": 1
}
```

---

## File References

### Frontend
- [index.php](index.php) - Line 1215-1238: Timekeeping Records Table HTML
- [js/staff-timekeeping.js](js/staff-timekeeping.js) - JavaScript to load and display records

### Backend
- [php/staff-timekeeping-api.php](php/staff-timekeeping-api.php) - API to fetch records for managers
- [php/timekeeping-api.php](php/timekeeping-api.php) - API for clock in/out from Time Clock Terminal
- [php/database.php](php/database.php) - Database connection

### Diagnostic
- [test-timekeeping.php](test-timekeeping.php) - Diagnostic page to check setup

---

## Manual Database Check

If you need to manually check the database:

```sql
-- Check if table exists
SHOW TABLES LIKE 'attendance_records';

-- Count today's records
SELECT COUNT(*) FROM attendance_records WHERE DATE(date) = CURDATE();

-- View today's records with employee details
SELECT
    ar.date,
    ar.time_in,
    ar.time_out,
    ar.hours_worked,
    ar.status,
    e.full_name,
    e.employee_number,
    e.position
FROM attendance_records ar
JOIN employees e ON ar.employee_id = e.id
WHERE DATE(ar.date) = CURDATE()
ORDER BY ar.time_in DESC;

-- View all recent records (last 7 days)
SELECT
    ar.date,
    e.full_name,
    ar.time_in,
    ar.time_out,
    ar.hours_worked
FROM attendance_records ar
JOIN employees e ON ar.employee_id = e.id
WHERE ar.date >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)
ORDER BY ar.date DESC, ar.time_in DESC;
```

---

## Success Criteria

You'll know it's working when:

1. ✅ Diagnostic page shows green checkmarks
2. ✅ Employee can clock in at Time Clock Terminal
3. ✅ Success message appears after clock in
4. ✅ Manager Dashboard → Staff & Timekeeping shows the record
5. ✅ Record displays: Date, Name, Role, Time In, Status
6. ✅ After clock out, Hours Worked and Time Out appear

---

## Next Steps After Fix

Once working, you can:
1. Add more employees via Manager → Staff & Timekeeping → Add Employee
2. Have all employees clock in/out daily
3. View attendance reports by date
4. Export attendance data for payroll
5. Monitor employee attendance patterns

---

## Support

If issues persist after following this guide:
1. Run the diagnostic page and screenshot the results
2. Check browser console for errors (F12 → Console tab)
3. Check browser network tab for failed API calls (F12 → Network tab)
4. Verify database credentials in `php/database.php`
