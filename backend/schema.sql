-- SQL Script to Create Tables for Payment Reconciliation App
-- Use this in Azure Data Studio or SQL Server Management Studio

-- 1. Create PartyEmails Table
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

-- 2. Create ReconciliationSessions Table
CREATE TABLE [ReconciliationSessions] (
    [id] UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    [filename] NVARCHAR(255) NULL,
    [uploadedAt] DATETIMEOFFSET NULL DEFAULT GETDATE(),
    [matchedResults] NVARCHAR(MAX) NULL, -- Stores JSON
    [skipLogLines] NVARCHAR(MAX) NULL,    -- Stores JSON Array
    [partiesWithoutEmail] NVARCHAR(MAX) NULL, -- Stores JSON
    [summary] NVARCHAR(MAX) NULL,         -- Stores JSON
    [status] NVARCHAR(50) DEFAULT 'pending',
    [createdAt] DATETIMEOFFSET NOT NULL DEFAULT GETDATE(),
    [updatedAt] DATETIMEOFFSET NOT NULL DEFAULT GETDATE()
);

-- 3. Create EmailLogs Table
CREATE TABLE [EmailLogs] (
    [id] UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    [sessionId] NVARCHAR(255) NOT NULL,
    [status] NVARCHAR(50) NOT NULL, -- SENT, FAILED, SKIPPED
    [partyCode] NVARCHAR(255) NULL,
    [partyName] NVARCHAR(255) NULL,
    [emails] NVARCHAR(MAX) NULL, -- Stores JSON Array
    [cc] NVARCHAR(MAX) NULL,     -- Stores JSON Array
    [error] NVARCHAR(MAX) NULL,
    [sentAt] DATETIMEOFFSET NULL DEFAULT GETDATE(),
    [batchId] UNIQUEIDENTIFIER NULL FOREIGN KEY REFERENCES [ReconciliationSessions]([id]),
    [payments] NVARCHAR(MAX) NULL, -- Stores JSON
    [debits] NVARCHAR(MAX) NULL,   -- Stores JSON
    [createdAt] DATETIMEOFFSET NOT NULL DEFAULT GETDATE(),
    [updatedAt] DATETIMEOFFSET NOT NULL DEFAULT GETDATE()
);

-- 4. Create GoogleAuths Table
CREATE TABLE [GoogleAuths] (
    [id] UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    [email] NVARCHAR(255) NOT NULL UNIQUE,
    [refreshToken] NVARCHAR(MAX) NOT NULL,
    [isActive] BIT DEFAULT 1,
    [createdAt] DATETIMEOFFSET NOT NULL DEFAULT GETDATE(),
    [updatedAt] DATETIMEOFFSET NOT NULL DEFAULT GETDATE()
);
