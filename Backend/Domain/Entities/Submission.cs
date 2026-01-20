using Domain.Enums;

namespace Domain.Entities;

public class Submission
{
    public Guid Id { get; set; }

    public SubmissionType Type { get; set; }

    public SubmissionStatus Status { get; set; }

    public string Domain { get; set; } = "";

    public string Name { get; set; } = "";

    public string Email { get; set; } = "";

    public string? Message { get; set; }

    public string? UploadedBy { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
