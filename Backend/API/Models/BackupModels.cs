namespace API.Models;

public class BackupResultDto
{
    public string BackupId { get; set; } = "";
    public string CreatedAtUtc { get; set; } = "";
    public string BackupRootPath { get; set; } = "";
    public string DatabaseFile { get; set; } = "";
    public string UploadsZip { get; set; } = "";
    public string PrivateUploadsZip { get; set; } = "";
    public string? PublicAssetsZip { get; set; }
    public string ManifestFile { get; set; } = "";
}

public class BackupManifestDto
{
    public string BackupId { get; set; } = "";
    public string CreatedAtUtc { get; set; } = "";
    public string EnvironmentName { get; set; } = "";
    public string AppName { get; set; } = "Purple Backend";
    public string DatabaseFile { get; set; } = "";
    public long DatabaseSizeBytes { get; set; }
    public string UploadsZip { get; set; } = "";
    public long UploadsZipSizeBytes { get; set; }
    public string PrivateUploadsZip { get; set; } = "";
    public long PrivateUploadsZipSizeBytes { get; set; }
    public string? PublicAssetsZip { get; set; }
    public long? PublicAssetsZipSizeBytes { get; set; }
}