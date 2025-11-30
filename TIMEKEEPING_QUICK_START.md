# Time Keeping System - Quick Start Guide

## 🚀 Installation (3 Steps)

### Step 1: Run Database Migration
```bash
mysql -u root -p pos_jither < database/migration_timekeeping_system.sql
```

### Step 2: Verify Files
All files are already in place:
- ✅ [css/timekeeping.css](css/timekeeping.css)
- ✅ [js/timekeeping.js](js/timekeeping.js)
- ✅ [php/timekeeping-api.php](php/timekeeping-api.php)
- ✅ index.php (updated)

### Step 3: Test
1. Open browser → Navigate to your POS system
2. Should see Time Keeping page (not login!)
3. Enter: `EMP001`
4. Click "TIME IN"
5. Success! ✅

---

## 👤 Employee Instructions

### How to Clock In
1. Open the POS website
2. Enter your employee number (e.g., `EMP001`)
3. Click **"TIME IN"** button
4. Success message appears with your name
5. Your status shows on the screen

### How to Clock Out
1. Enter your employee number (same as morning)
2. Click **"TIME OUT"** button
3. System shows hours worked
4. You're done for the day! 🎉

### View Your Attendance
- Right panel shows your history
- Click filters: Weekly, Monthly, etc.
- See all your time in/out records

---

## 👔 Manager Instructions

### How to Access Manager Dashboard
1. On time keeping page, scroll to bottom
2. Click **"Manager Login"** link
3. Enter manager credentials:
   - Username: `manager`
   - Password: `1234`
4. Access full dashboard with staff management

---

## 📋 Sample Employees (For Testing)

| Employee# | Name | Position |
|-----------|------|----------|
| EMP001 | John Smith | Barista |
| EMP002 | Jane Doe | Cashier |
| EMP003 | Mike Johnson | Kitchen Staff |
| EMP004 | Sarah Williams | Server |
| EMP005 | David Brown | Barista |

---

## ✅ Rules

- ✅ One TIME IN per day
- ✅ One TIME OUT per day
- ✅ Locked after TIME OUT until next day
- ✅ Must TIME IN before TIME OUT
- ✅ No time in = Marked ABSENT
- ✅ Hours automatically calculated

---

## 🎨 What Employees See

```
┌─────────────────────────────────┐
│     🕐 Employee Time Keeping     │
│     Jowen's Kitchen & Cafe       │
├─────────────────────────────────┤
│   Current Time: 08:45:32         │
│   Monday, January 21, 2025       │
├─────────────────────────────────┤
│   Employee Number:               │
│   [ Enter your ID here ]         │
├─────────────────────────────────┤
│   ⏰ TIME IN    🏁 TIME OUT      │
├─────────────────────────────────┤
│   Your attendance history →      │
└─────────────────────────────────┘
```

---

## 🔧 Daily Maintenance

### Mark Absences (Optional Automation)
```bash
# Run once daily at 11:59 PM
mysql -u root -p pos_jither -e "CALL mark_absent_employees(CURDATE());"
```

Or set up cron job:
```bash
59 23 * * * mysql -u root -p pos_jither -e "CALL mark_absent_employees(CURDATE());"
```

---

## ❓ Common Questions

**Q: Do employees need to log in?**
A: No! Just enter employee number.

**Q: Can I clock in multiple times?**
A: No, only once per day.

**Q: What if I forget to clock out?**
A: Ask your manager to check the system.

**Q: Can I see my past attendance?**
A: Yes! Right panel shows history with filters.

**Q: What happens if I don't clock in?**
A: System marks you as absent.

**Q: How do managers access the system?**
A: Click "Manager Login" at bottom of time keeping page.

---

## 🎯 Key Features

1. **No Login for Employees** - Just employee number
2. **Auto-Lock** - Locks after time out until tomorrow
3. **Real-Time Clock** - Shows current time/date
4. **Attendance History** - Filter by week, month, year
5. **Auto-Absence** - Marks absent if no time in
6. **Manager Access** - Separate login for full system

---

## 📞 Support

For issues:
1. Check [TIMEKEEPING_SYSTEM_COMPLETE.md](TIMEKEEPING_SYSTEM_COMPLETE.md)
2. Verify database migration completed
3. Check browser console (F12) for errors
4. Ensure employee number exists and is active

---

## 🎉 That's It!

**Your time keeping system is ready to use!**

Employees just need to:
1. Enter their number
2. Click TIME IN/OUT
3. Done! ✅

**Simple. Modern. Effective.** ⏰
