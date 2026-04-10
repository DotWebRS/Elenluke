using API.Models;
using API.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace API.Controllers;

[ApiController]
[Route("api/backups")]
[Authorize(Roles = "Admin")]
public class BackupsController : ControllerBase
{
    private readonly IBackupService _backupService;
    private readonly IWebHostEnvironment _env;

    public BackupsController(IBackupService backupService, IWebHostEnvironment env)
    {
        _backupService = backupService;
        _env = env;
    }

    [HttpPost("create")]
    public async Task<ActionResult<BackupResultDto>> Create(CancellationToken cancellationToken)
    {
        var result = await _backupService.CreateBackupAsync(cancellationToken);
        return Ok(result);
    }

    [HttpGet("latest")]
    public ActionResult<object> Latest()
    {
        var backupBaseDir = Path.Combine(_env.ContentRootPath, "App_Data", "Backups");
        if (!Directory.Exists(backupBaseDir))
        {
            return Ok(new { exists = false });
        }

        var latestDir = new DirectoryInfo(backupBaseDir)
            .GetDirectories()
            .OrderByDescending(d => d.CreationTimeUtc)
            .FirstOrDefault();

        if (latestDir == null)
        {
            return Ok(new { exists = false });
        }

        var manifestPath = Path.Combine(latestDir.FullName, "manifest.json");
        return Ok(new
        {
            exists = true,
            backupId = latestDir.Name,
            path = latestDir.FullName,
            manifestPath
        });
    }
}