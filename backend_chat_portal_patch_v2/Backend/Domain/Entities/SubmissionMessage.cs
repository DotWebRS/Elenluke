namespace Domain.Entities;

public class SubmissionMessage
{
    public Guid Id { get; set; }
    public Guid SubmissionId { get; set; }
    public Submission Submission { get; set; } = null!;
    public string SenderType { get; set; } = "Admin"; // Admin, Editor, PortalUser, Customer, System
    public string SenderEmail { get; set; } = "";
    public string Body { get; set; } = "";
    public bool IsInternal { get; set; } = false;
    public DateTime CreatedAtUtc { get; set; } = DateTime.UtcNow;
}
