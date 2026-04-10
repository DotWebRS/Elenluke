using Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace Persistence;

public class AppDbContext : DbContext
{
      public AppDbContext(DbContextOptions<AppDbContext> options)
          : base(options)
      {
      }

      public DbSet<User> Users => Set<User>();
      public DbSet<Submission> Submissions => Set<Submission>();
      public DbSet<SubmissionField> SubmissionFields => Set<SubmissionField>();
      public DbSet<SubmissionFile> SubmissionFiles => Set<SubmissionFile>();
      public DbSet<SubmissionReply> SubmissionReplies => Set<SubmissionReply>();
      public DbSet<SubmissionMessage> SubmissionMessages => Set<SubmissionMessage>();
      public DbSet<SubmissionParticipant> SubmissionParticipants => Set<SubmissionParticipant>();
      public DbSet<CmsEntry> CmsEntries => Set<CmsEntry>();
      public DbSet<AuditLog> AuditLogs => Set<AuditLog>();
      public DbSet<ContentEntry> ContentEntries => Set<ContentEntry>();

      protected override void OnModelCreating(ModelBuilder modelBuilder)
      {
            base.OnModelCreating(modelBuilder);

            modelBuilder.Entity<CmsEntry>(entity =>
            {
                  entity.HasIndex(x => new { x.SiteKey, x.Key }).IsUnique();
                  entity.Property(x => x.SiteKey).HasMaxLength(100).IsRequired();
                  entity.Property(x => x.Key).HasMaxLength(200).IsRequired();
                  entity.Property(x => x.Json).IsRequired();
                  entity.Property(x => x.UpdatedAtUtc).HasConversion(v => v, v => DateTime.SpecifyKind(v, DateTimeKind.Utc));
            });

            modelBuilder.Entity<ContentEntry>(entity =>
            {
                  entity.HasIndex(x => new { x.Key, x.Locale }).IsUnique();
                  entity.Property(x => x.Key).HasMaxLength(255).IsRequired();
                  entity.Property(x => x.Locale).HasMaxLength(16).IsRequired();
                  entity.Property(x => x.Json).IsRequired();
                  entity.Property(x => x.Published).HasDefaultValue(true);
                  entity.Property(x => x.UpdatedAt).HasConversion(v => v, v => DateTime.SpecifyKind(v, DateTimeKind.Utc));
            });

            modelBuilder.Entity<Submission>(entity =>
            {
                  entity.Property(x => x.IsArchived).HasDefaultValue(false);
                  entity.Property(x => x.ArchivedAtUtc).HasConversion(v => v, v => v.HasValue ? DateTime.SpecifyKind(v.Value, DateTimeKind.Utc) : v);
                  entity.HasIndex(x => new { x.Domain, x.IsArchived, x.CreatedAt });
            });

            modelBuilder.Entity<SubmissionReply>()
                .HasOne(r => r.Submission)
                .WithMany()
                .HasForeignKey(r => r.SubmissionId);

            modelBuilder.Entity<SubmissionMessage>(entity =>
            {
                  entity.HasIndex(x => new { x.SubmissionId, x.CreatedAtUtc });
                  entity.Property(x => x.SenderType).HasMaxLength(32).IsRequired();
                  entity.Property(x => x.SenderEmail).HasMaxLength(256).IsRequired();
                  entity.Property(x => x.Body).IsRequired();
                  entity.HasOne(x => x.Submission).WithMany().HasForeignKey(x => x.SubmissionId).OnDelete(DeleteBehavior.Cascade);
            });

            modelBuilder.Entity<SubmissionParticipant>(entity =>
            {
                  entity.HasIndex(x => new { x.SubmissionId, x.UserId }).IsUnique();
                  entity.Property(x => x.AddedByEmail).HasMaxLength(256);
                  entity.HasOne(x => x.Submission).WithMany().HasForeignKey(x => x.SubmissionId).OnDelete(DeleteBehavior.Cascade);
                  entity.HasOne(x => x.User).WithMany().HasForeignKey(x => x.UserId).OnDelete(DeleteBehavior.Cascade);
            });

            modelBuilder.Entity<AuditLog>(entity =>
            {
                  entity.HasIndex(x => new { x.EntityType, x.CreatedAtUtc });
                  entity.Property(x => x.UserEmail).HasMaxLength(256);
                  entity.Property(x => x.EntityType).HasMaxLength(128);
                  entity.Property(x => x.Action).HasMaxLength(128);
                  entity.Property(x => x.EntityId).HasMaxLength(256);
                  entity.Property(x => x.Details).IsRequired();
                  entity.Property(x => x.CreatedAtUtc).HasConversion(v => v, v => DateTime.SpecifyKind(v, DateTimeKind.Utc));
            });
      }
}
