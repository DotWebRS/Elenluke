using System;

namespace Domain.Entities;

public class CmsEntry
{
    public Guid Id { get; set; }
    public string SiteKey { get; set; } = "";
    public string Key { get; set; } = "";
    public string Json { get; set; } = "{}";
    public DateTime UpdatedAtUtc { get; set; } = DateTime.UtcNow;
}
