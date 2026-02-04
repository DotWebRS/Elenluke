using Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace Persistence;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options)
        : base(options)
    {
    }

    // KORISNICI / SUBMISSIONS
    public DbSet<User> Users => Set<User>();
    public DbSet<Submission> Submissions => Set<Submission>();
    public DbSet<SubmissionField> SubmissionFields => Set<SubmissionField>();
    public DbSet<SubmissionFile> SubmissionFiles => Set<SubmissionFile>();
    public DbSet<SubmissionReply> SubmissionReplies => Set<SubmissionReply>();

    // STARI CMS (siteKey + key)
    public DbSet<CmsEntry> CmsEntries => Set<CmsEntry>();

    // AUDIT LOG
    public DbSet<AuditLog> AuditLogs => Set<AuditLog>();

    // NOVI CONTENT CMS (Key + Locale, bez siteKey-a)
    public DbSet<ContentEntry> ContentEntries => Set<ContentEntry>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // CmsEntry: jedan zapis po (SiteKey, Key)
        modelBuilder.Entity<CmsEntry>(entity =>
        {
            entity.HasIndex(x => new { x.SiteKey, x.Key })
                  .IsUnique();

            entity.Property(x => x.SiteKey)
                  .HasMaxLength(100)
                  .IsRequired();

            entity.Property(x => x.Key)
                  .HasMaxLength(200)
                  .IsRequired();

            entity.Property(x => x.Json)
                  .IsRequired();

            entity.Property(x => x.UpdatedAtUtc)
                  .HasConversion(
                      v => v,
                      v => DateTime.SpecifyKind(v, DateTimeKind.Utc)
                  );
        });

        // ContentEntry: jedan zapis po (Key, Locale)
        // npr: Key = "pmg-app.home.hero", Locale = "en"
        modelBuilder.Entity<ContentEntry>(entity =>
        {
            entity.HasIndex(x => new { x.Key, x.Locale })
                  .IsUnique();

            entity.Property(x => x.Key)
                  .HasMaxLength(255)
                  .IsRequired();

            entity.Property(x => x.Locale)
                  .HasMaxLength(16)
                  .IsRequired();

            entity.Property(x => x.Json)
                  .IsRequired();

            entity.Property(x => x.Published)
                  .HasDefaultValue(true);

            entity.Property(x => x.UpdatedAt)
                  .HasConversion(
                      v => v,
                      v => DateTime.SpecifyKind(v, DateTimeKind.Utc)
                  );
        });

        // SubmissionReply → Submission
        modelBuilder.Entity<SubmissionReply>()
            .HasOne(r => r.Submission)
            .WithMany()
            .HasForeignKey(r => r.SubmissionId);

        // AuditLog – sređivanje + indeks
        modelBuilder.Entity<AuditLog>(entity =>
        {
            entity.HasIndex(x => new { x.EntityType, x.CreatedAtUtc });

            entity.Property(x => x.UserEmail)
                  .HasMaxLength(256);

            entity.Property(x => x.EntityType)
                  .HasMaxLength(128);

            entity.Property(x => x.Action)
                  .HasMaxLength(128);

            entity.Property(x => x.EntityId)
                  .HasMaxLength(256);

            entity.Property(x => x.Details)
                    .IsRequired(); // SQLite će sam napraviti TEXT

            entity.Property(x => x.CreatedAtUtc)
                  .HasConversion(
                      v => v,
                      v => DateTime.SpecifyKind(v, DateTimeKind.Utc)
                  );

        });
    }
}
