using System.IO.Compression;
using System.Text.Json;
using API.Models;
using Microsoft.EntityFrameworkCore;
using Persistence;

namespace API.Services;

public interface IBackupService
{
    Task<BackupResultDto> CreateBackupAsync(CancellationToken cancellationToken = default);
}

public class BackupService : IBackupService
{
    private readonly IWebHostEnvironment _env;
    private readonly AppDbContext _db;
    private readonly ILogger<BackupService> _logger;

    public BackupService(
        IWebHostEnvironment env,
        AppDbContext db,
        ILogger<BackupService> logger)
    {
        _env = env;
        _db = db;
        _logger = logger;
    }

    public async Task<BackupResultDto> CreateBackupAsync(CancellationToken cancellationToken = default)
    {
        var now = DateTime.UtcNow;
        var backupId = now.ToString("yyyyMMdd_HHmmss");
        var contentRoot = _env.ContentRootPath;
        var webRoot = _env.WebRootPath ?? Path.Combine(contentRoot, "wwwroot");

        var backupBaseDir = Path.Combine(contentRoot, "App_Data", "Backups");
        Directory.CreateDirectory(backupBaseDir);

        var backupRoot = Path.Combine(backupBaseDir, backupId);
        Directory.CreateDirectory(backupRoot);

        var databasePath = _db.Database.GetDbConnection().DataSource;
        if (string.IsNullOrWhiteSpace(databasePath) || !File.Exists(databasePath))
        {
            throw new FileNotFoundException("Database file not found.", databasePath);
        }

        // 1) Copy database
        var dbTargetPath = Path.Combine(backupRoot, Path.GetFileName(databasePath));
        await CopyFileAsync(databasePath, dbTargetPath, cancellationToken);

        // 2) Zip uploads
        var uploadsSource = Path.Combine(webRoot, "uploads");
        var uploadsZip = Path.Combine(backupRoot, "uploads.zip");
        CreateZipIfExists(uploadsSource, uploadsZip);

        // 3) Zip private uploads
        var privateUploadsSource = Path.Combine(contentRoot, "uploads_private");
        var privateUploadsZip = Path.Combine(backupRoot, "uploads_private.zip");
        CreateZipIfExists(privateUploadsSource, privateUploadsZip);

        // 4) Optional public assets zip
        // Ako koristiš assete drugde, promeni ovu putanju.
        var publicAssetsSource = Path.Combine(webRoot, "assets");
        string? publicAssetsZip = null;
        if (Directory.Exists(publicAssetsSource))
        {
            publicAssetsZip = Path.Combine(backupRoot, "public_assets.zip");
            CreateZipIfExists(publicAssetsSource, publicAssetsZip);
        }

        // 5) Manifest
        var manifest = new BackupManifestDto
        {
            BackupId = backupId,
            CreatedAtUtc = now.ToString("O"),
            EnvironmentName = _env.EnvironmentName,
            DatabaseFile = Path.GetFileName(dbTargetPath),
            DatabaseSizeBytes = GetFileSizeSafe(dbTargetPath),
            UploadsZip = Path.GetFileName(uploadsZip),
            UploadsZipSizeBytes = GetFileSizeSafe(uploadsZip),
            PrivateUploadsZip = Path.GetFileName(privateUploadsZip),
            PrivateUploadsZipSizeBytes = GetFileSizeSafe(privateUploadsZip),
            PublicAssetsZip = publicAssetsZip is null ? null : Path.GetFileName(publicAssetsZip),
            PublicAssetsZipSizeBytes = publicAssetsZip is null ? null : GetFileSizeSafe(publicAssetsZip)
        };

        var manifestPath = Path.Combine(backupRoot, "manifest.json");
        var manifestJson = JsonSerializer.Serialize(manifest, new JsonSerializerOptions
        {
            WriteIndented = true
        });
        await File.WriteAllTextAsync(manifestPath, manifestJson, cancellationToken);

        _logger.LogInformation("Backup created successfully at {BackupRoot}", backupRoot);

        return new BackupResultDto
        {
            BackupId = backupId,
            CreatedAtUtc = now.ToString("O"),
            BackupRootPath = backupRoot,
            DatabaseFile = dbTargetPath,
            UploadsZip = uploadsZip,
            PrivateUploadsZip = privateUploadsZip,
            PublicAssetsZip = publicAssetsZip,
            ManifestFile = manifestPath
        };
    }

    private static async Task CopyFileAsync(string sourcePath, string targetPath, CancellationToken cancellationToken)
    {
        await using var source = new FileStream(sourcePath, FileMode.Open, FileAccess.Read, FileShare.ReadWrite);
        await using var target = new FileStream(targetPath, FileMode.Create, FileAccess.Write, FileShare.None);
        await source.CopyToAsync(target, cancellationToken);
    }

    private static void CreateZipIfExists(string sourceDirectory, string zipPath)
    {
        if (!Directory.Exists(sourceDirectory))
        {
            using var archive = ZipFile.Open(zipPath, ZipArchiveMode.Create);
            return;
        }

        if (File.Exists(zipPath))
            File.Delete(zipPath);

        ZipFile.CreateFromDirectory(sourceDirectory, zipPath, CompressionLevel.Optimal, includeBaseDirectory: true);
    }

    private static long GetFileSizeSafe(string path)
    {
        return File.Exists(path) ? new FileInfo(path).Length : 0;
    }
}