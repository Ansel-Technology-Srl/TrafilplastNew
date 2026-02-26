using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using RecinzioniPortal.API.Data;
using RecinzioniPortal.API.DTOs;
using RecinzioniPortal.API.Models;
using RecinzioniPortal.API.Services;
using ClosedXML.Excel;

namespace RecinzioniPortal.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class UtentiController : ControllerBase
{
    private readonly AppDbContext _db;

    public UtentiController(AppDbContext db) => _db = db;

    // Middleware check: solo Admin (tipo 1)
    private bool IsAdmin() => User.FindFirst("UserType")?.Value == "1";

    [HttpGet]
    public async Task<IActionResult> GetAll([FromQuery] string? search, [FromQuery] byte? userType)
    {
        if (!IsAdmin()) return Forbid();

        var query = _db.Utenti.AsQueryable();

        if (!string.IsNullOrEmpty(search))
            query = query.Where(u => (u.UserName ?? "").Contains(search) || (u.UserLogin ?? "").Contains(search));

        if (userType.HasValue)
            query = query.Where(u => u.UserType == userType.Value);

        var users = await query.OrderBy(u => u.UserID)
            .Select(u => AuthService.MapToDto(u))
            .ToListAsync();

        return Ok(new ApiResponse<List<UserDto>>(true, null, users));
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(short id)
    {
        if (!IsAdmin()) return Forbid();

        var user = await _db.Utenti.FindAsync(id);
        if (user == null) return NotFound(new ApiResponse(false, "Utente non trovato"));

        return Ok(new ApiResponse<UserDto>(true, null, AuthService.MapToDto(user)));
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateUserRequest req)
    {
        if (!IsAdmin()) return Forbid();

        // Validazione
        var errors = ValidateUser(req.UserType, req.ItemID, req.ItemIDSede);
        if (errors != null) return BadRequest(new ApiResponse(false, errors));

        if (await _db.Utenti.AnyAsync(u => u.UserID == req.UserID))
            return Conflict(new ApiResponse(false, "UserID già esistente"));

        if (await _db.Utenti.AnyAsync(u => u.UserLogin == req.UserLogin))
            return Conflict(new ApiResponse(false, "Login già esistente"));

        var utente = new Utente
        {
            UserID = req.UserID,
            UserLogin = req.UserLogin,
            Password = BCrypt.Net.BCrypt.HashPassword(req.Password, 12),
            UserName = req.UserName,
            UserType = req.UserType,
            MailAddress = req.MailAddress,
            ItemID = req.ItemID,
            ItemIDSede = req.ItemIDSede
        };

        _db.Utenti.Add(utente);
        await _db.SaveChangesAsync();

        return Created($"/api/utenti/{utente.UserID}", new ApiResponse<UserDto>(true, "Utente creato", AuthService.MapToDto(utente)));
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> Update(short id, [FromBody] UpdateUserRequest req)
    {
        if (!IsAdmin()) return Forbid();

        var utente = await _db.Utenti.FindAsync(id);
        if (utente == null) return NotFound(new ApiResponse(false, "Utente non trovato"));

        if (req.UserType.HasValue)
        {
            var errors = ValidateUser(req.UserType.Value, req.ItemID ?? utente.ItemID, req.ItemIDSede ?? utente.ItemIDSede);
            if (errors != null) return BadRequest(new ApiResponse(false, errors));
            utente.UserType = req.UserType.Value;
        }

        if (req.UserLogin != null) utente.UserLogin = req.UserLogin;
        if (req.Password != null) utente.Password = BCrypt.Net.BCrypt.HashPassword(req.Password, 12);
        if (req.UserName != null) utente.UserName = req.UserName;
        if (req.MailAddress != null) utente.MailAddress = req.MailAddress;
        if (req.ItemID != null) utente.ItemID = req.ItemID;
        if (req.ItemIDSede != null) utente.ItemIDSede = req.ItemIDSede;

        await _db.SaveChangesAsync();
        return Ok(new ApiResponse<UserDto>(true, "Utente aggiornato", AuthService.MapToDto(utente)));
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(short id)
    {
        if (!IsAdmin()) return Forbid();

        var utente = await _db.Utenti.FindAsync(id);
        if (utente == null) return NotFound(new ApiResponse(false, "Utente non trovato"));

        _db.Utenti.Remove(utente);
        await _db.SaveChangesAsync();
        return Ok(new ApiResponse(true, "Utente eliminato"));
    }

    [HttpGet("export")]
    public async Task<IActionResult> Export()
    {
        if (!IsAdmin()) return Forbid();

        var users = await _db.Utenti.OrderBy(u => u.UserID).ToListAsync();

        using var workbook = new XLWorkbook();
        var ws = workbook.AddWorksheet("Utenti");

        // Header
        ws.Cell(1, 1).Value = "UserID";
        ws.Cell(1, 2).Value = "UserLogin";
        ws.Cell(1, 3).Value = "UserName";
        ws.Cell(1, 4).Value = "UserType";
        ws.Cell(1, 5).Value = "MailAddress";
        ws.Cell(1, 6).Value = "ItemID";
        ws.Cell(1, 7).Value = "ItemIDSede";

        for (int i = 0; i < users.Count; i++)
        {
            ws.Cell(i + 2, 1).Value = users[i].UserID;
            ws.Cell(i + 2, 2).Value = users[i].UserLogin;
            ws.Cell(i + 2, 3).Value = users[i].UserName;
            ws.Cell(i + 2, 4).Value = users[i].UserType;
            ws.Cell(i + 2, 5).Value = users[i].MailAddress;
            ws.Cell(i + 2, 6).Value = users[i].ItemID;
            ws.Cell(i + 2, 7).Value = users[i].ItemIDSede;
        }

        var ms = new MemoryStream();
        workbook.SaveAs(ms);
        ms.Position = 0;

        return File(ms, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", "utenti_export.xlsx");
    }

    [HttpPost("import")]
    public async Task<IActionResult> Import(IFormFile file, [FromQuery] string mode = "merge")
    {
        if (!IsAdmin()) return Forbid();

        if (file == null || file.Length == 0)
            return BadRequest(new ApiResponse(false, "File non fornito"));

        var result = new ImportResult(0, 0, 0, new List<ImportError>());
        var errori = new List<ImportError>();
        int righeImportate = 0;
        int totaleRighe = 0;

        using var stream = file.OpenReadStream();
        using var workbook = new XLWorkbook(stream);
        var ws = workbook.Worksheet(1);

        var rows = ws.RangeUsed()?.RowsUsed().Skip(1); // Skip header
        if (rows == null) return Ok(new ImportResult(0, 0, 0, new List<ImportError>()));

        if (mode == "replace")
        {
            _db.Utenti.RemoveRange(_db.Utenti.Where(u => u.UserType != 1)); // Non cancellare admin
        }

        foreach (var row in rows)
        {
            totaleRighe++;
            try
            {
                var userId = (short)row.Cell(1).GetDouble();
                var utente = new Utente
                {
                    UserID = userId,
                    UserLogin = row.Cell(2).GetString(),
                    Password = BCrypt.Net.BCrypt.HashPassword(row.Cell(3).GetString(), 12),
                    UserName = row.Cell(4).GetString(),
                    UserType = (byte)row.Cell(5).GetDouble(),
                    MailAddress = row.Cell(6).GetString(),
                    ItemID = row.Cell(7).IsEmpty() ? null : row.Cell(7).GetString(),
                    ItemIDSede = row.Cell(8).IsEmpty() ? null : row.Cell(8).GetString()
                };

                var existing = await _db.Utenti.FindAsync(utente.UserID);
                if (existing != null)
                {
                    if (mode == "merge")
                    {
                        existing.UserLogin = utente.UserLogin;
                        existing.Password = utente.Password;
                        existing.UserName = utente.UserName;
                        existing.UserType = utente.UserType;
                        existing.MailAddress = utente.MailAddress;
                        existing.ItemID = utente.ItemID;
                        existing.ItemIDSede = utente.ItemIDSede;
                    }
                }
                else
                {
                    _db.Utenti.Add(utente);
                }
                righeImportate++;
            }
            catch (Exception ex)
            {
                errori.Add(new ImportError(totaleRighe + 1, "Row", ex.Message));
            }
        }

        await _db.SaveChangesAsync();
        return Ok(new ImportResult(totaleRighe, righeImportate, errori.Count, errori));
    }

    private string? ValidateUser(byte userType, string? itemId, string? itemIdSede)
    {
        return userType switch
        {
            1 => null, // Admin: nessun vincolo
            2 when string.IsNullOrEmpty(itemId) => "ItemID obbligatorio per Super User",
            3 or 4 when string.IsNullOrEmpty(itemId) || string.IsNullOrEmpty(itemIdSede) =>
                "ItemID e ItemIDSede obbligatori per Capo Negozio/Operatore",
            _ => null
        };
    }
}
