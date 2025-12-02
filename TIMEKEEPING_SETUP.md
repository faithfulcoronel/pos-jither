# Time Clock Terminal Setup Guide

## Employee Not Found Error

If you see "Employee not found. Please check your employee number" when trying to use the Time Clock Terminal, it means the employee accounts need to be activated in the database.

## Quick Fix

Run this SQL command in your database:

```sql
UPDATE staff_accounts
SET status = 'Active'
WHERE employee_number IN ('EMP001', 'EMP002', 'EMP003', 'EMP004');
```

Or run the provided script:
```bash
mysql -u root -p pos_jither < database/activate_employees.sql
```

## Test Employees

After activation, you can test with these employee numbers:

- **EMP001** - Jowen (Manager)
- **EMP002** - Elsa (Cashier)
- **EMP003** - Maria Santos (Barista)
- **EMP004** - Juan Dela Cruz (Cashier)

## How Time Clock Works

1. **Employee Access Only**: The Time Clock Terminal is for employees to clock in/out
2. **No Cashier Access**: Cashiers cannot access the Time Clock from their dashboard
3. **Active Status Required**: Employees must have `status = 'Active'` in `staff_accounts` table
4. **Daily Tracking**: System tracks time in, time out, and hours worked per day

## Adding New Employees

To add a new employee to the timekeeping system:

```sql
INSERT INTO staff_accounts (role, name, employee_number, status)
VALUES ('Cashier', 'Employee Name', 'EMP005', 'Active');
```

Make sure to:
- Use a unique employee number (e.g., EMP005, EMP006, etc.)
- Set status to 'Active' to allow time clock access
- Choose appropriate role (Manager, Cashier, Barista, etc.)
