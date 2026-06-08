-- Roles table
CREATE TABLE "Roles" (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) UNIQUE NOT NULL,
    created_at TIMESTAMP CURENT_TIMESTAMP,
    updated_at TIMESTAMP CURRENT_TIMESTAMP
)

-- Users Table
CREATE TABLE 'Users' (
      id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role_id INT NOT NULL,
    department VARCHAR(100),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (role_id) REFERENCES "Roles"(id) ON DELETE CASCADE
)


-- AttendanceRecords table
CREATE TABLE "AttendanceRecords" (
    id SERIAL PRIMARY KEY,
    user_id INT NOT NULL,
    date DATE NOT NULL,
    clock_in_time TIMESTAMP,
    clock_out_time TIMESTAMP,
    status VARCHAR(20) DEFAULT 'absent',
    total_hours DECIMAL(5,2),
    is_corrected BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES "Users"(id) ON DELETE CASCADE,
    UNIQUE (user_id, date)
);

-- CorrectionRequests table
CREATE TABLE "CorrectionRequests" (
    id SERIAL PRIMARY KEY,
    user_id INT NOT NULL,
    attendance_record_id INT NOT NULL,
    request_type VARCHAR(20) NOT NULL,
    date DATE NOT NULL,
    corrected_time TIMESTAMP NOT NULL,
    reason TEXT NOT NULL,
    status VARCHAR(20) DEFAULT 'pending',
    reviewed_by INT,
    reviewer_remarks TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES "Users"(id) ON DELETE CASCADE,
    FOREIGN KEY (attendance_record_id) REFERENCES "AttendanceRecords"(id) ON DELETE CASCADE,
    FOREIGN KEY (reviewed_by) REFERENCES "Users"(id) ON DELETE SET NULL
);

-- AttendanceRules table
CREATE TABLE "AttendanceRules" (
    id SERIAL PRIMARY KEY,
    work_start_time TIME NOT NULL,
    work_end_time TIME NOT NULL,
    min_hours_per_day DECIMAL(5,2) NOT NULL,
    late_threshold_minutes INT NOT NULL,
    created_by INT NOT NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (created_by) REFERENCES "Users"(id) ON DELETE CASCADE
);

-- AuditLogs table
CREATE TABLE "AuditLogs" (
    id SERIAL PRIMARY KEY,
    actor_id INT NOT NULL,
    action VARCHAR(100) NOT NULL,
    target_table VARCHAR(50) NOT NULL,
    target_id INT NOT NULL,
    old_value JSONB,
    new_value JSONB,
    ip_address VARCHAR(45),
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (actor_id) REFERENCES "Users"(id) ON DELETE CASCADE
);