using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using RecinzioniPortal.API.DTOs;
using RecinzioniPortal.API.Services;

namespace RecinzioniPortal.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class ConfiguratoreController : ControllerBase
{
    private readonly ConfiguratoreService _service;

    public ConfiguratoreController(ConfiguratoreService service)
    {
        _service = service;
    }

    private string GetItemID()
        => User.FindFirst("ItemID")?.Value ?? "";

    private string? GetItemIDSede()
        => User.FindFirst("ItemIDSede")?.Value;

    /// <summary>
    /// POST /api/configuratore/distinta-base
    /// </summary>
    [HttpPost("distinta-base")]
    public async Task<IActionResult> CalcolaDistintaBase([FromBody] DistintaBaseRequest request)
    {
        var validazione = _service.Valida(request);
        if (!validazione.IsValid)
            return BadRequest(new { success = false, error = validazione.Errore });

        try
        {
            var result = await _service.CalcolaDistintaBase(request, GetItemID(), GetItemIDSede());
            return Ok(new { success = true, data = result });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { success = false, error = "Errore nel calcolo della distinta base: " + ex.Message });
        }
    }

    /// <summary>
    /// GET /api/configuratore/info
    /// </summary>
    [HttpGet("info")]
    public async Task<IActionResult> GetInfo()
    {
        var colori = ConfiguratoreService.GetColoriDisponibili()
            .Select(c => new { hex = c.Key, nome = c.Value })
            .ToList();

        var tipiConfigurazione = await _service.GetTipiConfigurazione();

        return Ok(new
        {
            success = true,
            data = new
            {
                colori,
                altezze = ConfiguratoreService.GetAltezzeValide(),
                tabellaDoghe = ConfiguratoreService.GetTabellaDoghe()
                    .Select(t => new { altezza = t.Key, persiana = t.Value.Persiana, pieno = t.Value.Pieno }),
                limiti = new { lunghezzaMin = 10, lunghezzaMax = 150, maxSezioni = 20, angoliPreset = new[] { 0, 90 } },
                tipiConfigurazione
            }
        });
    }

    /// <summary>
    /// POST /api/configuratore/valida
    /// </summary>
    [HttpPost("valida")]
    public IActionResult Valida([FromBody] DistintaBaseRequest request)
    {
        var result = _service.Valida(request);
        return Ok(new { success = true, data = result });
    }
}
