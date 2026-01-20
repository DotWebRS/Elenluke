using Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace Persistence;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options)
        : base(options) { }

    public DbSet<User> Users => Set<User>();
    public DbSet<Submission> Submissions => Set<Submission>();
    public DbSet<SubmissionField> SubmissionFields => Set<SubmissionField>();
    public DbSet<SubmissionFile> SubmissionFiles => Set<SubmissionFile>();
    public DbSet<SubmissionReply> SubmissionReplies => Set<SubmissionReply>();

    public DbSet<CmsEntry> CmsEntries => Set<CmsEntry>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        modelBuilder.Entity<CmsEntry>()
            .HasIndex(x => new { x.SiteKey, x.Key })
            .IsUnique();

        modelBuilder.Entity<CmsEntry>()
            .Property(x => x.Json)
            .HasColumnType("nvarchar(max)");

        modelBuilder.Entity<SubmissionReply>()
            .HasOne(r => r.Submission)
            .WithMany()
            .HasForeignKey(r => r.SubmissionId);

    }
}
