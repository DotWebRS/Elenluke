using System.Text.Json;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Persistence;

namespace API.Controllers;

[ApiController]
[Route("api/content")]
public class ContentController : ControllerBase
{
    private readonly AppDbContext _db;

    public ContentController(AppDbContext db)
    {
        _db = db;
    }


    [HttpGet("{fullKey}")]
    [AllowAnonymous]
    public async Task<IActionResult> Get(string fullKey, [FromQuery] string? locale)
    {
        if (string.IsNullOrWhiteSpace(fullKey) || !fullKey.Contains('.'))
            return BadRequest("fullKey must be like siteKey.key");

        var firstDot = fullKey.IndexOf('.');
        var siteKey = fullKey.Substring(0, firstDot);
        var key = fullKey.Substring(firstDot + 1);

        string? keyWithLocale = null;
        if (!string.IsNullOrWhiteSpace(locale))
            keyWithLocale = $"{key}.{locale.Trim().ToLower()}";


        CmsEntryProjection? entry = null;

        if (keyWithLocale != null)
        {
            entry = await _db.CmsEntries
                .AsNoTracking()
                .Where(x => x.SiteKey == siteKey && x.Key == keyWithLocale)
                .Select(x => new CmsEntryProjection
                {
                    Json = x.Json
                })
                .FirstOrDefaultAsync();
        }

 
        if (entry == null)
        {
            entry = await _db.CmsEntries
                .AsNoTracking()
                .Where(x => x.SiteKey == siteKey && x.Key == key)
                .Select(x => new CmsEntryProjection
                {
                    Json = x.Json
                })
                .FirstOrDefaultAsync();
        }

        if (entry == null)
            return NotFound();

        try
        {
            using var doc = JsonDocument.Parse(entry.Json ?? "{}");
            return Ok(doc.RootElement.Clone());
        }
        catch
        {
            return StatusCode(500, "Stored content JSON is invalid.");
        }
    }

    private sealed class CmsEntryProjection
    {
        public string Json { get; set; } = "{}";
    }
}
