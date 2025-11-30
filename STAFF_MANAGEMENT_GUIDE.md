# Staff Management & Time Keeping Guide
## Jowen's Kitchen & Cafe - Simplified Workflow

---

## 📋 Overview

This system provides a streamlined way to manage staff accounts and track employee time. The Manager creates staff accounts with **Employee Numbers**, which employees use to clock in/out at the Time Keeping terminal.

### Key Features:
✅ **Simplified Staff Creation** - Only 3 fields required
✅ **Automatic Integration** - Staff accounts automatically sync with Time Keeping system
✅ **Lock Mechanism** - Prevents duplicate time-ins on the same day
✅ **Modern POS Interface** - Touch-friendly design optimized for tablets

---

## 🎯 Workflow

### Step 1: Manager Creates Staff Account

**Location**: Manager Dashboard → Staff Management

**Required Information**:
1. **Full Name** - Employee's complete name (e.g., "Juan Dela Cruz")
2. **Role/Position** - Job title (Cashier, Barista, Server, Kitchen Staff, Supervisor, Manager)
3. **Employee Number** - Unique ID for time tracking (e.g., "EMP001")

**Important**: The Employee Number is the ONLY credential employees need for time tracking. Choose a simple, memorable format.

### Step 2: Employee Uses Employee Number for Time Tracking

**Location**: Time Keeping Terminal (Default Landing Page)

**Process**:
1. Employee enters their **Employee Number** (e.g., EMP001)
2. System displays employee name and status
3. Employee clicks **TIME IN** to start shift
4. Employee clicks **TIME OUT** to end shift

---

## 🔢 Employee Number Guidelines

### Format Recommendations:
- **EMP001, EMP002, EMP003...** (Recommended: Simple sequential)
- **BAR001, CASH001, SRV001...** (By role prefix)
- **JDC001** (Initials + number)
- **2025001** (Year + sequence)

### Rules:
- ✅ Letters and numbers only (A-Z, 0-9)
- ✅ Minimum 3 characters
- ✅ Maximum 20 characters
- ✅ Must be unique
- ✅ Case-insensitive (automatically converted to uppercase)
- ❌ No spaces or special characters

### Examples:
```
✅ GOOD:
EMP001
BARISTA01
JDCRUZ
CASHIER2025

❌ BAD:
EM 01        (contains space)
EMP-001      (contains hyphen)
EM           (too short)
```

---

## 🔒 Time-In Lock Mechanism

### How It Works:

**Same Day Protection**:
- Employee can TIME IN only **once per day**
- Employee can TIME OUT only **once per day**
- After TIME OUT, account is **locked until next day**

**Example Timeline**:
```
Day 1:
08:00 AM - TIME IN ✅ (Allowed)
08:05 AM - TIME IN ❌ (Blocked: "You have already timed in today")
05:00 PM - TIME OUT ✅ (Allowed)
05:05 PM - TIME IN ❌ (Blocked: Account locked until tomorrow)

Day 2:
08:00 AM - TIME IN ✅ (Allowed - new day, lock reset)
```

### Visual Indicators:

**Status Badges**:
- 🟢 **Clocked In** - Currently working
- ⚫ **Clocked Out** - Shift completed
- 🟡 **Locked** - Already completed shift today
- 🔴 **Absent** - Did not clock in
- ✅ **Present** - Attendance confirmed

---

## 📊 Staff Management Dashboard

### Header Section
- **Title**: Staff Management
- **Subtitle**: Manage employee accounts and time records
- **Action Button**: ➕ Add New Staff

### Staff Statistics
- **Total Staff**: Count of all active staff members
- **Clocked In Today**: Number of employees currently working

### Staff Accounts Table

**Columns**:
1. 💼 **Role** - Job position
2. 👤 **Name** - Employee full name
3. ⏰ **Time In** - Clock-in time (if clocked in today)
4. 🏁 **Time Out** - Clock-out time (if clocked out today)
5. ⏱️ **Hours** - Hours worked today
6. 📊 **Status** - Current status badge
7. ⚙️ **Actions** - Edit/Delete buttons

### Timekeeping Records

**Filter Options**:
- **Today** - Today's records only
- **This Week** - Current week
- **This Month** - Current month

**Columns**:
1. 📅 **Date** - Record date
2. 👤 **Name** - Employee name
3. 💼 **Role** - Job position
4. ⏰ **Time In** - Clock-in time
5. 🏁 **Time Out** - Clock-out time
6. ⏱️ **Hours Worked** - Calculated hours
7. 📊 **Status** - Attendance status

---

## 🎨 Design Features

### Modern POS-Style Interface
- **Clean White Cards** - Professional appearance
- **Touch-Friendly Buttons** - 44px minimum touch targets
- **Color-Coded Status** - Instant visual feedback
- **Responsive Layout** - Works on desktop, tablet, and mobile

### Color Palette
```css
🟠 Primary Actions: #FF8C42 (Orange)
🟤 Headers: #8B6F47 (Brown)
🟢 Success/Active: #10B981 (Green)
🔴 Danger/Locked: #EF4444 (Red)
🟡 Warning: #F59E0B (Yellow)
```

### Typography
- **Headers**: Poppins (Bold, Modern)
- **Body Text**: Inter (Clean, Readable)
- **Employee Numbers**: Large, Bold, Uppercase

---

## 💻 Database Schema

### Staff Accounts Table
```sql
CREATE TABLE staff_accounts (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    role VARCHAR(64) NOT NULL,
    name VARCHAR(191) NOT NULL,
    employee_number VARCHAR(20) UNIQUE,
    status VARCHAR(32) DEFAULT 'Inactive',
    time_in DATETIME NULL,
    time_out DATETIME NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Employees Table (Time Keeping)
```sql
CREATE TABLE employees (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    employee_number VARCHAR(20) UNIQUE NOT NULL,
    full_name VARCHAR(191) NOT NULL,
    position VARCHAR(100),
    department VARCHAR(100),
    status ENUM('active', 'inactive', 'suspended') DEFAULT 'active',
    date_hired DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Attendance Records Table
```sql
CREATE TABLE attendance_records (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    employee_id INT UNSIGNED NOT NULL,
    employee_number VARCHAR(20) NOT NULL,
    date DATE NOT NULL,
    time_in DATETIME,
    time_out DATETIME,
    hours_worked DECIMAL(5,2) DEFAULT 0.00,
    status ENUM('present', 'absent', 'late', 'half_day') DEFAULT 'present',
    is_locked BOOLEAN DEFAULT FALSE,
    UNIQUE KEY unique_employee_date (employee_id, date)
);
```

---

## 🚀 Setup Instructions

### 1. Run Database Migration

```bash
# Navigate to database directory
cd database

# Run the migration to add employee_number field
mysql -u your_username -p pos_jither < migration_add_employee_number.sql
```

### 2. Verify Installation

Access your POS system and check:
- ✅ Staff Management page loads correctly
- ✅ Add Staff form shows 3 fields (Name, Role, Employee Number)
- ✅ Employee Number field accepts alphanumeric input
- ✅ Created staff can be found in Time Keeping terminal

### 3. Create First Staff Member

1. Login as Manager
2. Go to **Staff Management**
3. Click **➕ Add New Staff**
4. Fill in:
   - **Full Name**: Test Employee
   - **Role**: Cashier
   - **Employee Number**: EMP001
5. Click **Add Staff Member**
6. Verify success message shows employee number

### 4. Test Time Tracking

1. Logout or open Time Keeping terminal
2. Enter employee number: **EMP001**
3. Click **TIME IN**
4. Verify success message and status display
5. Try to TIME IN again → Should be blocked
6. Click **TIME OUT**
7. Try to TIME IN again → Should be locked until tomorrow

---

## ❓ Troubleshooting

### Issue: "Employee number already in use"
**Solution**: Choose a different employee number. Each must be unique.

### Issue: Employee can't clock in
**Possible Causes**:
1. Already timed in today → Wait until next day
2. Employee number not found → Check spelling/capitalization
3. Employee status inactive → Manager needs to activate account

### Issue: Form won't submit
**Check**:
1. All 3 fields filled in?
2. Employee number at least 3 characters?
3. Employee number alphanumeric only (no spaces/symbols)?

### Issue: Time not recording
**Check**:
1. Database connection working?
2. Both `staff_accounts` and `employees` tables exist?
3. Check browser console for JavaScript errors

---

## 📝 Best Practices

### For Managers:

1. **Use Sequential Numbers**
   - Start with EMP001, EMP002, etc.
   - Easy to remember and manage

2. **Keep a Master List**
   - Document all employee numbers
   - Include employee name and role
   - Update when staff changes

3. **Train New Employees**
   - Show them how to use employee number
   - Explain TIME IN/OUT process
   - Clarify daily lock policy

4. **Review Daily**
   - Check who clocked in/out
   - Verify hours worked
   - Follow up on absences

### For Employees:

1. **Memorize Your Number**
   - Write it down initially
   - Practice entering it
   - Don't share with others

2. **Clock In On Time**
   - Arrive early
   - Clock in immediately upon arrival
   - Don't forget or you'll be marked absent

3. **Clock Out Before Leaving**
   - Remember to clock out
   - Verify hours are recorded
   - If locked, contact manager

---

## 📞 Support

### Common Questions:

**Q: Can I change an employee number?**
A: Yes, but it must be done through database directly. Contact system administrator.

**Q: What if I forget my employee number?**
A: Ask your manager to look it up in Staff Management dashboard.

**Q: Can I clock in early?**
A: Yes, you can clock in anytime. Manager can verify your actual shift hours.

**Q: What if I forget to clock out?**
A: Inform your manager immediately. They can manually update your record.

**Q: Why can't I clock in again today?**
A: The system prevents duplicate time-ins. You must wait until the next day.

---

## 📄 Related Documentation

- [MODERN_POS_DESIGN_SYSTEM.md](MODERN_POS_DESIGN_SYSTEM.md) - Complete design specifications
- [TIMEKEEPING_SYSTEM_COMPLETE.md](TIMEKEEPING_SYSTEM_COMPLETE.md) - Time keeping system details
- [database/migration_timekeeping_system.sql](database/migration_timekeeping_system.sql) - Database schema
- [database/migration_add_employee_number.sql](database/migration_add_employee_number.sql) - Employee number migration

---

## 🔄 Version History

**v2.0** (Current) - Simplified Staff Management
- Removed username/password fields
- Added employee number field
- Integrated with time keeping system
- Modern POS-style interface
- Lock mechanism for duplicate prevention

**v1.0** - Original System
- Username/password based
- Separate staff and timekeeping systems

---

*Last Updated: January 2025*
*System: Jowen's Kitchen & Cafe POS*
*Designer: Claude*
