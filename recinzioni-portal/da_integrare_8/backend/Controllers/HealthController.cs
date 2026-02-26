using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using RecinzioniPortal.API.Data;

namespace RecinzioniPortal.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class HealthController : ControllerBase
{
    private readonly AppDbContext _db;

    public HealthController(AppDbContext db) => _db = db;

    /// <summary>
    /// Health check endpoint. Verifica lo stato del servizio e la connettività al database.
    /// GET /api/health — Accesso anonimo (usato da script di deploy e monitoring).
    /// </summary>
    [HttpGet]
    [AllowAnonymous]
    public async Task<IActionResult> Get()
    {
        var dbOk = false;
        string? dbError = null;

        try
        {
            dbOk = await _db.Database.CanConnectAsync();
        }
        catch (Exception ex)
        {
            dbError = ex.Message;
        }

        var status = dbOk ? "healthy" : "degraded";
        var statusCode = dbOk ? 200 : 503;

        return StatusCode(statusCode, new
        {
            status,
            timestamp = DateTime.UtcNow,
            version = typeof(HealthController).Assembly.GetName().Version?.ToString() ?? "1.0.0",
            database = dbOk ? "connected" : "disconnected",
            databaseError = dbOk ? null : dbError,
            environment = Environment.GetEnvironmentVariable("ASPNETCORE_ENVIRONMENT") ?? "Production"
        });
    }
}
