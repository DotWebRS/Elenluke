using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Persistence;
using System.Text.Json;

namespace API.Controllers;

[ApiController]
[Route("api/content")]
public class ContentController : ControllerBase
{
    private readonly AppDbContext _db;
    public ContentController(AppDbContext db) { _db = db; }

    // GET /api/content/{siteKey}.{key}?locale=en
    [HttpGet("{fullKey}")]
    [AllowAnonymous]
    public async Task<IActionResult> Get(string fullKey, [FromQuery] string? locale)
    {
        if (string.IsNullOrWhiteSpace(fullKey) || !fullKey.Contains('.'))
            return BadRequest("fullKey must be like siteKey.key");

        var firstDot = fullKey.IndexOf('.');
        var siteKey = fullKey.Substring(0, firstDot);
        var key = fullKey.Substring(firstDot + 1);

        // Ako koristiš locale, možeš da ga “ugradiš” u key (fallback)
        // npr. prvo probaj key + "." + locale, pa fallback na key.
        string? keyWithLocale = null;
        if (!string.IsNullOrWhiteSpace(locale))
            keyWithLocale = $"{key}.{locale.Trim().ToLower()}";

        var entry = await _db.CmsEntries.AsNoTracking()
            .FirstOrDefaultAsync(x => x.SiteKey == siteKey && x.Key == (keyWithLocale ?? key));

        if (entry == null && keyWithLocale != null)
        {
            entry = await _db.CmsEntries.AsNoTracking()
                .FirstOrDefaultAsync(x => x.SiteKey == siteKey && x.Key == key);
        }

        if (entry == null) return NotFound();

        try
        {
            using var doc = JsonDocument.Parse(entry.Json);
            return Ok(doc.RootElement.Clone());
        }
        catch
        {
            return StatusCode(500, "Stored content JSON is invalid.");
        }
    }
}
