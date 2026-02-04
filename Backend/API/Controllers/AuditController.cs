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

    // GET /api/audit?entityType=Submission&entityId=...&from=2025-01-01&to=2025-12-31&take=200
    [HttpGet]
    public async Task<IActionResult> Get(
        [FromQuery] string? entityType,
        [FromQuery] string? entityId,
        [FromQuery] DateTime? from,
        [FromQuery] DateTime? to,
        [FromQuery] int take = 200)
    {
        if (take < 1) take = 50;
        if (take > 1000) take = 1000;

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
            .ToListAsync();

        return Ok(items);
    }
}
