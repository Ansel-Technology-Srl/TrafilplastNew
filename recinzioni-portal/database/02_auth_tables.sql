-- ============================================================
-- RECINZIONI PORTAL - Auth Module Database Update
-- Adds: PasswordResetTokens, LoginAttempts (brute-force)
-- Run AFTER 01_create_database.sql
-- ============================================================

USE [RecinzioniPortal]
GO

-- Token per il reset password via email
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'PasswordResetTokens')
CREATE TABLE [dbo].[PasswordResetTokens](
    [TokenID]     [int] IDENTITY(1,1) NOT NULL,
    [UserID]      [smallint]       NOT NULL,
    [Token]       [varchar](128)   NOT NULL,
    [ExpiresAt]   [datetime]       NOT NULL,
    [CreatedAt]   [datetime]       NOT NULL DEFAULT GETDATE(),
    [UsedAt]      [datetime]       NULL,      -- NULL = non ancora usato
    CONSTRAINT [PK_PasswordResetTokens] PRIMARY KEY ([TokenID]),
    CONSTRAINT [FK_PwdReset_Utenti] FOREIGN KEY ([UserID])
        REFERENCES [Utenti]([UserID]) ON DELETE CASCADE
)
GO

CREATE INDEX [IX_PwdReset_Token] ON [dbo].[PasswordResetTokens]([Token])
GO

-- Tracking tentativi di login (protezione brute-force)
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'LoginAttempts')
CREATE TABLE [dbo].[LoginAttempts](
    [AttemptID]    [int] IDENTITY(1,1) NOT NULL,
    [Username]     [varchar](32)    NOT NULL,
    [IpAddress]    [varchar](45)    NULL,
    [AttemptedAt]  [datetime]       NOT NULL DEFAULT GETDATE(),
    [Success]      [bit]            NOT NULL DEFAULT 0,
    CONSTRAINT [PK_LoginAttempts] PRIMARY KEY ([AttemptID])
)
GO

CREATE INDEX [IX_LoginAttempts_User] ON [dbo].[LoginAttempts]([Username], [AttemptedAt])
GO

PRINT 'Tabelle autenticazione aggiornate con successo.'
GO
