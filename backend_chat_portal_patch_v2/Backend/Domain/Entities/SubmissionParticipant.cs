namespace Domain.Entities;

public class SubmissionParticipant
{
    public Guid Id { get; set; }
    public Guid SubmissionId { get; set; }
    public Submission Submission { get; set; } = null!;
    public Guid UserId { get; set; }
    public User User { get; set; } = null!;
    public DateTime AddedAtUtc { get; set; } = DateTime.UtcNow;
    public string AddedByEmail { get; set; } = "";
}
