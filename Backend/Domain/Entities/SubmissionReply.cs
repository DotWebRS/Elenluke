namespace Domain.Entities;

public class SubmissionReply
{
    public Guid Id { get; set; }
    public Guid SubmissionId { get; set; }
    public Submission Submission { get; set; } = null!;
    public string ToEmail { get; set; } = "";
    public string Subject { get; set; } = "";
    public string Body { get; set; } = "";
    public DateTime SentAt { get; set; } = DateTime.UtcNow;
    public string SentBy { get; set; } = "";
}
