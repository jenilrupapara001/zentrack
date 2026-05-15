-- =========================================================================
-- ZenTrack Payment Reconciliation: Complete Database Setup Script
-- Target Database: Microsoft SQL Server (Azure SQL / Local MSSQL)
-- Description: Creates database, tables, indexes, and stored procedures.
-- =========================================================================

-- 1. Create Database if it doesn't exist
IF NOT EXISTS (SELECT name FROM sys.databases WHERE name = N'payment_recocilliation')
BEGIN
    CREATE DATABASE ZenTrackDB;
END
GO

USE ZenTrackDB;
GO

-- =========================================================================
-- 2. Drop Existing Tables (Uncomment if you want a clean wipe)
-- =========================================================================
/*
IF OBJECT_ID('EmailLogs', 'U') IS NOT NULL DROP TABLE EmailLogs;
IF OBJECT_ID('ReconciliationSessions', 'U') IS NOT NULL DROP TABLE ReconciliationSessions;
IF OBJECT_ID('PartyEmails', 'U') IS NOT NULL DROP TABLE PartyEmails;
IF OBJECT_ID('GoogleAuths', 'U') IS NOT NULL DROP TABLE GoogleAuths;
GO
*/

-- =========================================================================
-- 3. Create Tables
-- =========================================================================

-- PartyEmails: Stores party contact information
IF OBJECT_ID('PartyEmails', 'U') IS NOT NULL 
    PRINT 'Table PartyEmails already exists. Skipping creation.'
ELSE
BEGIN
    CREATE TABLE [PartyEmails] (
        [id] UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
        [partyCode] NVARCHAR(255) NULL,
        [partyName] NVARCHAR(255) NOT NULL,
        [email] NVARCHAR(255) NULL,
        [cc] NVARCHAR(255) NULL,
        [createdAt] DATETIMEOFFSET NOT NULL DEFAULT GETDATE(),
        [updatedAt] DATETIMEOFFSET NOT NULL DEFAULT GETDATE()
    );
    CREATE INDEX [idx_party_name] ON [PartyEmails] ([partyName]);
    CREATE INDEX [idx_party_code] ON [PartyEmails] ([partyCode]);
    PRINT 'Table PartyEmails created successfully.'
END
GO

-- ReconciliationSessions: Stores metadata about each upload/process session
IF OBJECT_ID('ReconciliationSessions', 'U') IS NOT NULL 
    PRINT 'Table ReconciliationSessions already exists. Skipping creation.'
ELSE
BEGIN
    CREATE TABLE [ReconciliationSessions] (
        [id] UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
        [filename] NVARCHAR(255) NULL,
        [uploadedAt] DATETIMEOFFSET NULL DEFAULT GETDATE(),
        [matchedResults] NVARCHAR(MAX) NULL,     -- Stores JSON data
        [skipLogLines] NVARCHAR(MAX) NULL,       -- Stores JSON Array
        [partiesWithoutEmail] NVARCHAR(MAX) NULL, -- Stores JSON data
        [summary] NVARCHAR(MAX) NULL,            -- Stores JSON Summary
        [status] NVARCHAR(50) DEFAULT 'pending', -- pending, processed, emailed
        [createdAt] DATETIMEOFFSET NOT NULL DEFAULT GETDATE(),
        [updatedAt] DATETIMEOFFSET NOT NULL DEFAULT GETDATE()
    );
    PRINT 'Table ReconciliationSessions created successfully.'
END
GO

-- EmailLogs: History of all emails sent or failed
IF OBJECT_ID('EmailLogs', 'U') IS NOT NULL 
    PRINT 'Table EmailLogs already exists. Skipping creation.'
ELSE
BEGIN
    CREATE TABLE [EmailLogs] (
        [id] UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
        [sessionId] NVARCHAR(255) NOT NULL,
        [status] NVARCHAR(50) NOT NULL,          -- SENT, FAILED, SKIPPED
        [partyCode] NVARCHAR(255) NULL,
        [partyName] NVARCHAR(255) NULL,
        [emails] NVARCHAR(MAX) NULL,             -- Stores JSON Array of recipients
        [cc] NVARCHAR(MAX) NULL,                  -- Stores JSON Array of CCs
        [error] NVARCHAR(MAX) NULL,
        [sentAt] DATETIMEOFFSET NULL DEFAULT GETDATE(),
        [batchId] UNIQUEIDENTIFIER NULL FOREIGN KEY REFERENCES [ReconciliationSessions]([id]),
        [payments] NVARCHAR(MAX) NULL,           -- Stores JSON of payment details
        [debits] NVARCHAR(MAX) NULL,             -- Stores JSON of debit details
        [createdAt] DATETIMEOFFSET NOT NULL DEFAULT GETDATE(),
        [updatedAt] DATETIMEOFFSET NOT NULL DEFAULT GETDATE()
    );
    PRINT 'Table EmailLogs created successfully.'
END
GO

-- GoogleAuths: Stores OAuth tokens for Gmail integration
IF OBJECT_ID('GoogleAuths', 'U') IS NOT NULL 
    PRINT 'Table GoogleAuths already exists. Skipping creation.'
ELSE
BEGIN
    CREATE TABLE [GoogleAuths] (
        [id] UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
        [email] NVARCHAR(255) NOT NULL UNIQUE,
        [refreshToken] NVARCHAR(MAX) NOT NULL,
        [isActive] BIT DEFAULT 1,
        [createdAt] DATETIMEOFFSET NOT NULL DEFAULT GETDATE(),
        [updatedAt] DATETIMEOFFSET NOT NULL DEFAULT GETDATE()
    );
    PRINT 'Table GoogleAuths created successfully.'
END
GO

-- =========================================================================
-- 4. Create Stored Procedures
-- =========================================================================

-- sp_GetDashboardStats: Aggregated KPIs and history for the dashboard
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

-- sp_GetDailyLogSummary: Day-wise breakdown for charting
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

-- sp_UpsertPartyEmail: Atomic update/insert for party mappings
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

PRINT '========================================================================='
PRINT ' ZenTrack Database Setup Completed Successfully!'
PRINT '========================================================================='
GO
