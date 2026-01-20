namespace Domain.Entities;

public class SubmissionFile
{
    public Guid Id { get; set; }
    public Guid SubmissionId { get; set; }

    public string FileName { get; set; } = null!;
    public string FilePath { get; set; } = null!;
    public string ContentType { get; set; } = null!;
    public long Size { get; set; }

    public Submission Submission { get; set; } = null!;
}
