# Manila Timezone Fix Guide

## Problem

The timekeeping records were showing incorrect times - not matching Manila time (UTC+8 / Asia/Manila).

## Root Cause

The PHP and MySQL servers were using different timezones (likely UTC or server default timezone) instead of Manila time (Asia/Manila / UTC+8).

## Solution Applied

I've updated all relevant files to use Manila timezone consistently across:
1. **PHP** - Set `date_default_timezone_set('Asia/Manila')`
2. **MySQL** - Set `time_zone = '+08:00'`

---

## Files Modified

### 1. Database Connection (Core Fix)
**File:** [php/database.php](php/database.php)

**Added:**
```php
// Set timezone to Manila (Asia/Manila) for PHP and MySQL
date_default_timezone_set('Asia/Manila');
$pdo->exec("SET time_zone = '+08:00'");
```

This ensures EVERY database connection uses Manila time for both PHP operations and MySQL timestamps.

### 2. Timekeeping API (Clock In/Out)
**File:** [php/timekeeping-api.php](php/timekeeping-api.php)

**Added:**
```php
// Set timezone to Manila
date_default_timezone_set('Asia/Manila');
```

Ensures clock in/out times are recorded in Manila time.

### 3. Staff Timekeeping API (Display Records)
**File:** [php/staff-timekeeping-api.php](php/staff-timekeeping-api.php)

**Added:**
```php
// Set timezone to Manila
date_default_timezone_set('Asia/Manila');
```

Ensures displayed times are formatted in Manila time.

### 4. Main API (Sales & General Operations)
**File:** [php/api.php](php/api.php)

**Added:**
```php
// Set timezone to Manila
date_default_timezone_set('Asia/Manila');
```

Ensures all sales transactions use Manila time.

### 5. Sales Analytics API
**File:** [php/sales-analytics-api.php](php/sales-analytics-api.php)

**Added:**
```php
// Set timezone to Manila
date_default_timezone_set('Asia/Manila');
```

Ensures sales reports show Manila time.

---

## How It Works

### Before Fix:
```
Employee clocks in at 9:00 AM Manila time
    ↓
Server using UTC (1:00 AM UTC)
    ↓
Database saves: 2025-12-09 01:00:00
    ↓
Display shows: 1:00 AM ❌ WRONG!
```

### After Fix:
```
Employee clocks in at 9:00 AM Manila time
    ↓
PHP timezone set to Asia/Manila
    ↓
MySQL timezone set to +08:00
    ↓
Database saves: 2025-12-09 09:00:00
    ↓
Display shows: 9:00 AM ✅ CORRECT!
```

---

## Testing the Fix

### Step 1: Clock In Test

1. Go to **Time Clock Terminal**
2. Enter employee number
3. Click **"Time In"**
4. Note the time displayed in the success message
5. **Verify:** Should match current Manila time

### Step 2: Check Database

Open phpMyAdmin and run:

```sql
-- Check current MySQL timezone setting
SELECT @@session.time_zone, @@global.time_zone;
-- Should show: +08:00

-- Check a recent attendance record
SELECT
    employee_id,
    time_in,
    time_out,
    DATE_FORMAT(time_in, '%Y-%m-%d %h:%i %p') as formatted_time_in
FROM attendance_records
WHERE DATE(date) = CURDATE()
ORDER BY time_in DESC
LIMIT 5;
-- Time should match Manila time
```

### Step 3: Manager Dashboard Test

1. Login as **Manager**
2. Go to **Staff & Timekeeping**
3. View **"Today's Timekeeping Records"**
4. **Verify:** Time In and Time Out columns show correct Manila time

### Step 4: Sales Records Test

1. Go to **Cashier** (or process a test sale)
2. Complete a sale
3. Go to **Manager → View Sales**
4. Check the timestamps on sales
5. **Verify:** Should show Manila time

---

## Timezone Settings Summary

| Component | Setting | Value |
|-----------|---------|-------|
| PHP Timezone | `date_default_timezone_set()` | `'Asia/Manila'` |
| MySQL Session | `SET time_zone` | `'+08:00'` |
| UTC Offset | - | UTC+8 |
| Region | - | Philippines / Manila |

---

## Common Timezone Issues & Solutions

### Issue: Old records still showing wrong time

**Cause:** Existing database records were saved in UTC or wrong timezone

**Solution:**
```sql
-- Option 1: If records are in UTC, convert to Manila time
UPDATE attendance_records
SET time_in = CONVERT_TZ(time_in, '+00:00', '+08:00'),
    time_out = CONVERT_TZ(time_out, '+00:00', '+08:00')
WHERE time_in < NOW() - INTERVAL 1 DAY;

-- Option 2: Add 8 hours to all records
UPDATE attendance_records
SET time_in = DATE_ADD(time_in, INTERVAL 8 HOUR),
    time_out = DATE_ADD(time_out, INTERVAL 8 HOUR)
WHERE DATE(date) < CURDATE();
```

**⚠️ WARNING:** Test this on a backup first! Make sure you know what timezone your old records are in.

### Issue: Server timezone is locked

**Cause:** Server admin has disabled timezone changes

**Solution:** Add to `php.ini`:
```ini
date.timezone = Asia/Manila
```

Or create `.htaccess` file:
```apache
php_value date.timezone Asia/Manila
```

### Issue: Different timezones for different users

**Cause:** Not applicable for this system (all users in Manila)

**Future Enhancement:** If you expand to multiple timezones:
1. Store all timestamps in UTC in database
2. Convert to user's local timezone on display
3. Use JavaScript for client-side timezone detection

---

## Verification Checklist

After the fix, verify these all show Manila time:

- [ ] Time Clock Terminal - Success message after clock in
- [ ] Manager Dashboard - Staff & Timekeeping - Time In column
- [ ] Manager Dashboard - Staff & Timekeeping - Time Out column
- [ ] View Sales - Transaction timestamps
- [ ] Business Reports - Report timestamps
- [ ] Database records (check via phpMyAdmin)

---

## How to Check Current Timezone

### Via PHP:
```php
<?php
echo "PHP Timezone: " . date_default_timezone_get() . "<br>";
echo "Current Time: " . date('Y-m-d H:i:s') . "<br>";
echo "Timezone Offset: " . date('P') . "<br>";
?>
```

### Via MySQL:
```sql
SELECT
    @@session.time_zone AS session_timezone,
    @@global.time_zone AS global_timezone,
    NOW() AS current_time,
    CONVERT_TZ(NOW(), @@session.time_zone, '+08:00') AS manila_time;
```

### Via JavaScript (Browser):
```javascript
console.log('Browser Timezone:', Intl.DateTimeFormat().resolvedOptions().timeZone);
console.log('Current Time:', new Date().toString());
```

---

## Best Practices for Timezone Handling

### 1. Always Set Timezone Early
```php
// At the very top of PHP files
date_default_timezone_set('Asia/Manila');
```

### 2. Use Consistent Database Time
```php
// When saving timestamps
$now = date('Y-m-d H:i:s'); // Already in Manila time
```

### 3. Store Dates Properly
```sql
-- Use DATETIME for timestamps
CREATE TABLE example (
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

### 4. Format for Display
```php
// Show user-friendly format
$formatted = date('F j, Y, g:i A', strtotime($timestamp));
// Example: December 9, 2025, 9:30 AM
```

---

## Timezone Reference

**Manila Time Details:**
- **Timezone:** Asia/Manila
- **UTC Offset:** UTC+8
- **DST:** No daylight saving time
- **Country:** Philippines
- **Also known as:** Philippine Standard Time (PST)

**When it's 12:00 PM (noon) in Manila:**
- New York: 11:00 PM (previous day)
- London: 4:00 AM
- Tokyo: 1:00 PM
- Sydney: 3:00 PM
- Dubai: 8:00 AM
- Los Angeles: 8:00 PM (previous day)

---

## Future Improvements (Optional)

### 1. Timezone Configuration File
Create `config/timezone.php`:
```php
<?php
define('APP_TIMEZONE', 'Asia/Manila');
date_default_timezone_set(APP_TIMEZONE);
```

### 2. Timezone Utility Functions
Create `php/timezone_utils.php`:
```php
<?php
function getCurrentManilaTime() {
    return date('Y-m-d H:i:s');
}

function formatManilaTime($timestamp, $format = 'F j, Y, g:i A') {
    return date($format, strtotime($timestamp));
}

function convertToManila($utcTimestamp) {
    $dt = new DateTime($utcTimestamp, new DateTimeZone('UTC'));
    $dt->setTimezone(new DateTimeZone('Asia/Manila'));
    return $dt->format('Y-m-d H:i:s');
}
```

### 3. JavaScript Time Display
For real-time clocks:
```javascript
function updateManilaTime() {
    const now = new Date();
    const options = {
        timeZone: 'Asia/Manila',
        hour12: true,
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
    };
    document.getElementById('clock').textContent =
        now.toLocaleTimeString('en-PH', options);
}
setInterval(updateManilaTime, 1000);
```

---

## Troubleshooting

### Problem: Still showing wrong time after fix

1. **Clear PHP opcache:**
   ```bash
   # If using opcache
   service php-fpm restart
   # Or in code
   opcache_reset();
   ```

2. **Restart web server:**
   ```bash
   # Apache
   service apache2 restart
   # Nginx
   service nginx restart
   ```

3. **Check php.ini:**
   ```bash
   php -i | grep timezone
   ```

4. **Verify database connection:**
   ```php
   $stmt = $pdo->query("SELECT @@session.time_zone");
   echo $stmt->fetchColumn(); // Should show +08:00
   ```

### Problem: Different times in different browsers

**Cause:** Timezone is now correct, but JavaScript is using browser's local timezone

**Solution:** Not a problem! The data is stored in Manila time. Browser display is just for user convenience.

---

## Summary

All timezone issues have been fixed by setting:

1. ✅ PHP timezone to `Asia/Manila` in all API files
2. ✅ MySQL timezone to `+08:00` in database connection
3. ✅ Consistent timezone across the entire application

**Result:** All timestamps (clock in/out, sales, reports) now display in Manila time!

---

## Testing Commands

Run these to verify the fix:

```bash
# Test PHP timezone
php -r "echo date_default_timezone_get();"
# Should output: Asia/Manila (after restart)

# Test current PHP time
php -r "echo date('Y-m-d H:i:s');"
# Should show Manila time

# Check MySQL timezone
mysql -u root -p -e "SELECT NOW(), @@session.time_zone;"
# Should show Manila time and +08:00
```

The timezone is now correctly set to Manila time throughout your entire POS system! 🎉
