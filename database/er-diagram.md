# Database Entity Relationship (ER) Diagram

Below is the visual relationship schema of the Leave Management System database.

```mermaid
erDiagram
    EMPLOYEE {
        string id PK
        string name
        string email UK
        string password
        string department
        Role role
        int leaveBalance
        dateTime createdAt
        dateTime updatedAt
    }

    LEAVE {
        string id PK
        string employeeId FK
        LeaveType leaveType
        dateTime startDate
        dateTime endDate
        int totalDays
        string reason
        LeaveStatus status
        string managerComment
        dateTime createdAt
        dateTime updatedAt
    }

    REFRESH_TOKEN {
        string id PK
        string token UK
        string employeeId FK
        dateTime expiresAt
        dateTime createdAt
    }

    AUDIT_LOG {
        string id PK
        string action
        string details
        string employeeId FK
        dateTime createdAt
    }

    EMPLOYEE ||--o{ LEAVE : "submits"
    EMPLOYEE ||--o{ REFRESH_TOKEN : "owns"
    EMPLOYEE ||--o{ AUDIT_LOG : "triggers"
```

## Enum Definitions

### Role
- `EMPLOYEE`
- `MANAGER`

### LeaveType
- `ANNUAL`
- `SICK`
- `CASUAL`
- `MATERNITY`
- `PATERNITY`
- `UNPAID`

### LeaveStatus
- `PENDING`
- `APPROVED`
- `REJECTED`
- `CANCELLED`
