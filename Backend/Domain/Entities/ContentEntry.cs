using System;

namespace Domain.Entities;

public class ContentEntry
{
    public Guid Id { get; set; }

    public string Key { get; set; } = "";

    public string Locale { get; set; } = "en";

    public string Json { get; set; } = "{}";

    public bool Published { get; set; } = true;

    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}
