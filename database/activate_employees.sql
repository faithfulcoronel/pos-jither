-- Activate sample employees for timekeeping
-- Run this to enable employees to use the Time Clock Terminal

UPDATE staff_accounts
SET status = 'Active'
WHERE employee_number IN ('EMP001', 'EMP002', 'EMP003', 'EMP004');

-- Verify the update
SELECT employee_number, name, role, status
FROM staff_accounts
WHERE employee_number IN ('EMP001', 'EMP002', 'EMP003', 'EMP004');
