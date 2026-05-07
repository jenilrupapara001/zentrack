-- 1. sp_GetDashboardStats: Single call to get all dashboard data
CREATE OR ALTER PROCEDURE sp_GetDashboardStats
    @DaysBack INT = 30
AS
BEGIN
    SET NOCOUNT ON;
    DECLARE @StartDate DATETIME = DATEADD(DAY, -@DaysBack, GETDATE());
    DECLARE @SevenDaysAgo DATETIME = DATEADD(DAY, -6, CAST(GETDATE() AS DATE));

    -- Result Set 1: Total Parties
    SELECT COUNT(*) as TotalParties FROM PartyEmails;

    -- Result Set 2: Email Status Stats (Last 30 days)
    SELECT 
        status as [Status],
        COUNT(*) as [Count]
    FROM EmailLogs
    WHERE createdAt >= @StartDate
    GROUP BY status;

    -- Result Set 3: Transmission History (Last 7 days)
    SELECT 
        FORMAT(createdAt, 'yyyy-MM-dd') as LogDate,
        SUM(CASE WHEN status = 'SENT' THEN 1 ELSE 0 END) as Sent,
        SUM(CASE WHEN status = 'FAILED' THEN 1 ELSE 0 END) as Failed
    FROM EmailLogs
    WHERE createdAt >= @SevenDaysAgo
    GROUP BY FORMAT(createdAt, 'yyyy-MM-dd')
    ORDER BY LogDate ASC;

    -- Result Set 4: Processing Volume (Last 7 days)
    SELECT 
        FORMAT(createdAt, 'yyyy-MM-dd') as LogDate,
        COUNT(*) as SessionCount
    FROM ReconciliationSessions
    WHERE createdAt >= @SevenDaysAgo
    GROUP BY FORMAT(createdAt, 'yyyy-MM-dd')
    ORDER BY LogDate ASC;
END;
GO

-- 2. sp_GetDailyLogSummary: For the Day-wise Email Logs component
CREATE OR ALTER PROCEDURE sp_GetDailyLogSummary
    @DaysBack INT = 30
AS
BEGIN
    SET NOCOUNT ON;
    SELECT 
        FORMAT(createdAt, 'yyyy-MM-dd') as _id,
        SUM(CASE WHEN status = 'SENT' THEN 1 ELSE 0 END) as sent,
        SUM(CASE WHEN status = 'FAILED' THEN 1 ELSE 0 END) as failed
    FROM EmailLogs
    WHERE createdAt >= DATEADD(DAY, -@DaysBack, GETDATE())
    GROUP BY FORMAT(createdAt, 'yyyy-MM-dd')
    ORDER BY _id DESC;
END;
GO

-- 3. sp_UpsertPartyEmail: Safe way to update/insert party emails
CREATE OR ALTER PROCEDURE sp_UpsertPartyEmail
    @PartyCode NVARCHAR(255),
    @PartyName NVARCHAR(255),
    @Email NVARCHAR(MAX),
    @CC NVARCHAR(MAX)
AS
BEGIN
    SET NOCOUNT ON;
    IF EXISTS (SELECT 1 FROM PartyEmails WHERE partyCode = @PartyCode AND partyName = @PartyName)
    BEGIN
        UPDATE PartyEmails 
        SET email = @Email, cc = @CC, updatedAt = GETDATE()
        WHERE partyCode = @PartyCode AND partyName = @PartyName;
    END
    ELSE
    BEGIN
        INSERT INTO PartyEmails (id, partyCode, partyName, email, cc, createdAt, updatedAt)
        VALUES (NEWID(), @PartyCode, @PartyName, @Email, @CC, GETDATE(), GETDATE());
    END
END;
GO
