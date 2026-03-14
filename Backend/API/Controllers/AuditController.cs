using Domain.Entities;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Persistence;

namespace API.Controllers;

[ApiController]
[Route("api/audit")]
[Authorize(Roles = "Admin")]
public class AuditController : ControllerBase
{
    private readonly AppDbContext _db;

    public AuditController(AppDbContext db)
    {
        _db = db;
    }

    [HttpGet]
    public async Task<IActionResult> Get(
        [FromQuery] string? entityType,
        [FromQuery] string? entityId,
        [FromQuery] DateTime? from,
        [FromQuery] DateTime? to,
        [FromQuery] int take = 200)
    {
        if (take < 1) take = 50;
        if (take > 200) take = 200;

        IQueryable<AuditLog> q = _db.AuditLogs.AsNoTracking();

        if (!string.IsNullOrWhiteSpace(entityType))
            q = q.Where(x => x.EntityType == entityType);

        if (!string.IsNullOrWhiteSpace(entityId))
            q = q.Where(x => x.EntityId == entityId);

        if (from.HasValue)
            q = q.Where(x => x.CreatedAtUtc >= from.Value);

        if (to.HasValue)
            q = q.Where(x => x.CreatedAtUtc <= to.Value);

        var items = await q
            .OrderByDescending(x => x.CreatedAtUtc)
            .Take(take)
            .Select(x => new
            {
                x.Id,
                x.Action,
                x.CreatedAtUtc,
                x.EntityId,
                x.EntityType,
                x.UserEmail,
                DetailsPreview = x.Details == null
                    ? null
                    : (x.Details.Length > 300
                        ? x.Details.Substring(0, 300) + "..."
                        : x.Details),
                DetailsLength = x.Details == null ? 0 : x.Details.Length
            })
            .ToListAsync();

        return Ok(items);
    }

    [HttpGet("{id:guid}")]
    public async Task<IActionResult> GetById(Guid id)
    {
        var item = await _db.AuditLogs
            .AsNoTracking()
            .Where(x => x.Id == id)
            .Select(x => new
            {
                x.Id,
                x.Action,
                x.CreatedAtUtc,
                x.EntityId,
                x.EntityType,
                x.UserEmail,
                x.Details
            })
            .FirstOrDefaultAsync();

        if (item == null)
            return NotFound();

        return Ok(item);
    }
}