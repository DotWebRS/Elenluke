using System;

namespace Domain.Entities;

public class ContentEntry
{
    public Guid Id { get; set; }

    // npr: "purple-crunch-publishing.home.hero"
    public string Key { get; set; } = "";

    // npr: "en"
    public string Locale { get; set; } = "en";

    // ceo JSON za komponentu (string)
    public string Json { get; set; } = "{}";

    public bool Published { get; set; } = true;

    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}
