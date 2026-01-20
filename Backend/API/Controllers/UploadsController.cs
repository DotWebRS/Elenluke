using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace API.Controllers;

[ApiController]
[Route("api/uploads")]
public class UploadsController : ControllerBase
{
    private readonly IWebHostEnvironment _env;

    public UploadsController(IWebHostEnvironment env)
    {
        _env = env;
    }

    // ADMIN – upload image/file for CMS (returns public URL under /uploads/...)
    [HttpPost("file")]
    [Authorize(Roles = "Admin")]
    [Consumes("multipart/form-data")]
    [RequestSizeLimit(20 * 1024 * 1024)]
    public async Task<IActionResult> Upload([FromForm] UploadFileForm form)
    {
        if (form.File == null || form.File.Length == 0)
            return BadRequest("file is required.");

        var folder = string.IsNullOrWhiteSpace(form.Folder) ? "cms" : form.Folder.Trim();
        folder = folder.Replace("..", "").Replace("\\", "/").Replace("//", "/");

        var webRoot = _env.WebRootPath ?? Path.Combine(_env.ContentRootPath, "wwwroot");
        var dir = Path.Combine(webRoot, "uploads", folder);
        Directory.CreateDirectory(dir);

        var ext = Path.GetExtension(form.File.FileName);
        var safeName = $"{Guid.NewGuid():N}{ext}";
        var fullPath = Path.Combine(dir, safeName);

        await using (var stream = System.IO.File.Create(fullPath))
        {
            await form.File.CopyToAsync(stream);
        }

        var url = $"/uploads/{folder}/{safeName}".Replace("\\", "/");
        return Ok(new { url });
    }
}

public class UploadFileForm
{
    public IFormFile? File { get; set; }
    public string? Folder { get; set; }
}
