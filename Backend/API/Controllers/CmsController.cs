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

    // ADMIN UPSERT
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
        }
        else
        {
            entry.Json = dto.Json ?? "{}";
            entry.UpdatedAtUtc = DateTime.UtcNow;
        }

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
