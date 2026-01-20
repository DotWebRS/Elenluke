namespace Domain.Entities;

public class SubmissionField
{
    public Guid Id { get; set; }
    public Guid SubmissionId { get; set; }

    public string Name { get; set; } = null!;
    public string Value { get; set; } = null!;

    public Submission Submission { get; set; } = null!;
}
