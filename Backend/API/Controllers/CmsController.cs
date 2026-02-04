using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Persistence;
using Domain.Entities;

namespace API.Controllers;

[ApiController]
[Route("api/cms")]
public class CmsController : ControllerBase
{
    private readonly AppDbContext _db;

    public CmsController(AppDbContext db)
    {
        _db = db;
    }

    // PUBLIC READ (frontend)
    [HttpGet]
    [AllowAnonymous]
    public IActionResult Get([FromQuery] string siteKey, [FromQuery] string key)
    {
      

        if (string.IsNullOrWhiteSpace(siteKey) || string.IsNullOrWhiteSpace(key))
            return BadRequest("siteKey and key are required.");

        var entry = _db.CmsEntries
            .AsNoTracking()
            .FirstOrDefault(x => x.SiteKey == siteKey && x.Key == key);

        if (entry == null) return NotFound();

        return Ok(new
        {
            siteKey = entry.SiteKey,
            key = entry.Key,
            json = entry.Json,
            updatedAtUtc = entry.UpdatedAtUtc
        });
    }

    // ADMIN UPSERT – koristi ga AdminPMG
    [HttpPut]
    [Authorize(Roles = "Admin,Editor")]
    public IActionResult Upsert([FromBody] CmsUpsertDto dto)
    {

        

        if (dto == null ||
            string.IsNullOrWhiteSpace(dto.SiteKey) ||
            string.IsNullOrWhiteSpace(dto.Key))
            return BadRequest("siteKey and key are required.");

        var entry = _db.CmsEntries
            .FirstOrDefault(x => x.SiteKey == dto.SiteKey && x.Key == dto.Key);


        if (entry == null)
        {
            entry = new CmsEntry
            {
                Id = Guid.NewGuid(),
                SiteKey = dto.SiteKey,
                Key = dto.Key,
                UpdatedAtUtc = DateTime.UtcNow,
                Json = dto.Json ?? "{}"
            };
            _db.CmsEntries.Add(entry);
            _db.SaveChanges();
        }
        else
        {
            entry.Json = dto.Json ?? "{}";
            entry.UpdatedAtUtc = DateTime.UtcNow;
        }

        var email = User?.Identity?.Name ?? User?.FindFirst("email")?.Value ?? "";

        var log = new AuditLog
        {
            Id = Guid.NewGuid(),
            CreatedAtUtc = DateTime.UtcNow,
            UserEmail = email ?? "",
            Action = "CMS_UPSERT",
            EntityType = "CmsEntry",
            EntityId = $"{dto.SiteKey}.{dto.Key}",
            Details = dto.Json ?? "{}"


        };

        

        _db.AuditLogs.Add(log);

        _db.SaveChanges();
        return Ok();
    }

   
    [HttpGet("content")]
    [AllowAnonymous]
    public IActionResult GetContent([FromQuery] string key, [FromQuery] string? locale = "en")
    {
        if (string.IsNullOrWhiteSpace(key))
            return BadRequest("key is required.");

        var loc = string.IsNullOrWhiteSpace(locale) ? "en" : locale.Trim();

        var entry = _db.ContentEntries
            .AsNoTracking()
            .Where(x => x.Key == key && x.Locale == loc)
            .OrderByDescending(x => x.UpdatedAt)
            .FirstOrDefault();

        if (entry == null) return NotFound();

        return Ok(new
        {
            key = entry.Key,
            locale = entry.Locale,
            json = entry.Json,
            published = entry.Published,
            updatedAt = entry.UpdatedAt
        });
    }

    [HttpPut("content")]
    [Authorize(Roles = "Admin,Editor")]
    public IActionResult UpsertContent([FromBody] ContentUpsertDto dto)
    {
        if (dto == null || string.IsNullOrWhiteSpace(dto.Key))
            return BadRequest("key is required.");

        var loc = string.IsNullOrWhiteSpace(dto.Locale) ? "en" : dto.Locale.Trim();

        var entry = _db.ContentEntries
            .FirstOrDefault(x => x.Key == dto.Key && x.Locale == loc);

        if (entry == null)
        {
            entry = new ContentEntry
            {
                Id = Guid.NewGuid(),
                Key = dto.Key,
                Locale = loc,
                Json = dto.Json ?? "{}",
                Published = dto.Published,
                UpdatedAt = DateTime.UtcNow
            };
            _db.ContentEntries.Add(entry);
        }
        else
        {
            entry.Json = dto.Json ?? "{}";
            entry.Published = dto.Published;
            entry.UpdatedAt = DateTime.UtcNow;
        }

        var email = User?.Identity?.Name ?? User?.FindFirst("email")?.Value ?? "";

        var log = new AuditLog
        {
            Id = Guid.NewGuid(),
            CreatedAtUtc = DateTime.UtcNow,
            UserEmail = email ?? "",
            Action = "CONTENT_UPSERT",
            EntityType = "ContentEntry",
            EntityId = $"{dto.Key}:{loc}",
            Details = dto.Json ?? "{}"
        };

        _db.AuditLogs.Add(log);

        _db.SaveChanges();
        return Ok();
    }
}

public class CmsUpsertDto
{
    public string SiteKey { get; set; } = "";
    public string Key { get; set; } = "";
    public string Json { get; set; } = "{}";
}

public class ContentUpsertDto
{
    public string Key { get; set; } = "";
    public string Locale { get; set; } = "en";
    public string Json { get; set; } = "{}";
    public bool Published { get; set; } = true;
}
