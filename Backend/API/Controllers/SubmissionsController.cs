using API.Services;
using Domain.Entities;
using Domain.Enums;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Persistence;
using System.Text;
using System.Text.Json;

namespace API.Controllers;

[ApiController]
[Route("api/submissions")]
public class SubmissionsController : ControllerBase
{
    private readonly AppDbContext _db;
    private readonly IWebHostEnvironment _env;
    private readonly IConfiguration _config;
    private readonly IEmailSender _email;

    public SubmissionsController(AppDbContext db, IWebHostEnvironment env, IConfiguration config, IEmailSender email)
    {
        _db = db;
        _env = env;
        _config = config;
        _email = email;
    }

    [HttpPost("form")]
    [AllowAnonymous]
    [Consumes("multipart/form-data")]
    [RequestSizeLimit(20 * 1024 * 1024)]
    public async Task<IActionResult> CreateForm([FromForm] SubmissionCreateForm form)
    {
        if (string.IsNullOrWhiteSpace(form.Name) || string.IsNullOrWhiteSpace(form.Email))
            return BadRequest("Name and Email are required.");

        var type = form.Type ?? SubmissionType.GeneralContactInquiry;

        // DemoUpload rules
        if (type == SubmissionType.DemoUpload)
        {
            if (string.IsNullOrWhiteSpace(form.UploadedBy))
                return BadRequest("UploadedBy is required for DemoUpload.");

            var ub = form.UploadedBy.Trim();
            if (!string.Equals(ub, "Artist", StringComparison.OrdinalIgnoreCase) &&
                !string.Equals(ub, "Manager", StringComparison.OrdinalIgnoreCase))
                return BadRequest("UploadedBy must be Artist or Manager.");

            if (form.Files == null || form.Files.Count == 0)
                return BadRequest("At least one file is required for DemoUpload.");
        }

        // SongwriterInformation rules (photo required)
        if (type == SubmissionType.SongwriterInformation)
        {
            if (form.Files == null || form.Files.Count == 0)
                return BadRequest("Photo is required for SongwriterInformation.");

            if (form.Files.Count > 1)
                return BadRequest("Only one photo is allowed for SongwriterInformation.");

            var ct = (form.Files[0]?.ContentType ?? "").ToLowerInvariant();
            if (!ct.StartsWith("image/"))
                return BadRequest("Photo must be an image file.");
        }

        var submission = new Submission
        {
            Id = Guid.NewGuid(),
            CreatedAt = DateTime.UtcNow,
            Status = SubmissionStatus.Unread,
            Type = type,
            Domain = (form.Domain ?? "").Trim(),
            Name = form.Name.Trim(),
            Email = form.Email.Trim(),
            Message = string.IsNullOrWhiteSpace(form.Message) ? null : form.Message.Trim(),
            UploadedBy = string.IsNullOrWhiteSpace(form.UploadedBy) ? null : form.UploadedBy.Trim()
        };

        _db.Submissions.Add(submission);

        var fieldsToInsert = new List<SubmissionField>();
        Dictionary<string, string> dict = new();

        if (!string.IsNullOrWhiteSpace(form.FieldsJson))
        {
            try
            {
                dict = JsonSerializer.Deserialize<Dictionary<string, string>>(
                    form.FieldsJson,
                    new JsonSerializerOptions { PropertyNameCaseInsensitive = true }
                ) ?? new Dictionary<string, string>();
            }
            catch
            {
                return BadRequest("fieldsJson must be a JSON object.");
            }
        }

        foreach (var kv in dict)
        {
            var key = (kv.Key ?? "").Trim();
            if (key.Length == 0) continue;

            fieldsToInsert.Add(new SubmissionField
            {
                Id = Guid.NewGuid(),
                SubmissionId = submission.Id,
                Name = key,
                Value = (kv.Value ?? "").Trim()
            });
        }

        // keep uploadedBy duplicated into fields (legacy compatibility)
        if (!string.IsNullOrWhiteSpace(submission.UploadedBy))
        {
            fieldsToInsert.Add(new SubmissionField
            {
                Id = Guid.NewGuid(),
                SubmissionId = submission.Id,
                Name = "uploadedBy",
                Value = submission.UploadedBy
            });
        }

        if (fieldsToInsert.Count > 0)
            _db.SubmissionFields.AddRange(fieldsToInsert);

        var savedFiles = new List<SubmissionFile>();

        if (form.Files != null && form.Files.Count > 0)
        {
            var privateRoot = Path.Combine(_env.ContentRootPath, "uploads_private");
            var dir = Path.Combine(privateRoot, "submissions", submission.Id.ToString("N"));
            Directory.CreateDirectory(dir);

            foreach (var file in form.Files)
            {
                if (file == null || file.Length <= 0) continue;

                var ext = Path.GetExtension(file.FileName);
                var storedName = $"{Guid.NewGuid():N}{ext}";
                var fullPath = Path.Combine(dir, storedName);

                await using (var stream = System.IO.File.Create(fullPath))
                {
                    await file.CopyToAsync(stream);
                }

                var relPath = Path.Combine("submissions", submission.Id.ToString("N"), storedName).Replace("\\", "/");

                var sf = new SubmissionFile
                {
                    Id = Guid.NewGuid(),
                    SubmissionId = submission.Id,
                    FileName = file.FileName,
                    FilePath = relPath,
                    ContentType = file.ContentType ?? "application/octet-stream",
                    Size = file.Length
                };

                savedFiles.Add(sf);
                _db.SubmissionFiles.Add(sf);
            }
        }

        await _db.SaveChangesAsync();

        try
        {
            var recipients = ResolveNotificationRecipients(submission.Type);
            var subject = BuildInternalSubject(submission);
            var body = BuildInternalBody(submission, dict, savedFiles);

            foreach (var r in recipients)
            {
                await _email.SendAsync(r, subject, body);
            }
        }
        catch
        {
            // ignore mail errors
        }

        return Ok(new { id = submission.Id });
    }

    // =========================
    // Inbox read: Admin + Inbox
    // =========================
    [HttpGet]
    [Authorize(Roles = "Admin,Inbox")]
    public async Task<IActionResult> GetAll(
        [FromQuery] string? search,
        [FromQuery] SubmissionStatus? status,
        [FromQuery] SubmissionType? type,
        [FromQuery] DateTime? from,
        [FromQuery] DateTime? to,
        [FromQuery] bool? hasFile,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 50)
    {
        if (page < 1) page = 1;
        if (pageSize < 1) pageSize = 50;
        if (pageSize > 200) pageSize = 200;

        IQueryable<Submission> query = _db.Submissions.AsNoTracking();

        if (status.HasValue)
            query = query.Where(x => x.Status == status.Value);

        if (type.HasValue)
            query = query.Where(x => x.Type == type.Value);

        if (from.HasValue)
            query = query.Where(x => x.CreatedAt >= from.Value);

        if (to.HasValue)
            query = query.Where(x => x.CreatedAt <= to.Value);

        if (!string.IsNullOrWhiteSpace(search))
        {
            var s = search.Trim().ToLowerInvariant();

            var fieldMatchIds = _db.SubmissionFields.AsNoTracking()
                .Where(f => f.Name.ToLower().Contains(s) || f.Value.ToLower().Contains(s))
                .Select(f => f.SubmissionId);

            query = query.Where(x =>
                x.Name.ToLower().Contains(s) ||
                x.Email.ToLower().Contains(s) ||
                x.Domain.ToLower().Contains(s) ||
                (x.Message != null && x.Message.ToLower().Contains(s)) ||
                x.Id.ToString().ToLower().Contains(s) ||
                fieldMatchIds.Contains(x.Id)
            );
        }

        if (hasFile.HasValue)
        {
            var fileIds = _db.SubmissionFiles.AsNoTracking().Select(f => f.SubmissionId).Distinct();
            query = hasFile.Value ? query.Where(x => fileIds.Contains(x.Id)) : query.Where(x => !fileIds.Contains(x.Id));
        }

        var total = await query.CountAsync();

        var list = await query
            .OrderByDescending(x => x.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();

        var ids = list.Select(x => x.Id).ToList();

        var fields = await _db.SubmissionFields.AsNoTracking()
            .Where(f => ids.Contains(f.SubmissionId))
            .ToListAsync();

        var files = await _db.SubmissionFiles.AsNoTracking()
            .Where(f => ids.Contains(f.SubmissionId))
            .ToListAsync();

        var replyCounts = await _db.SubmissionReplies.AsNoTracking()
            .Where(r => ids.Contains(r.SubmissionId))
            .GroupBy(r => r.SubmissionId)
            .Select(g => new { SubmissionId = g.Key, Count = g.Count() })
            .ToListAsync();

        var replyMap = replyCounts.ToDictionary(x => x.SubmissionId, x => x.Count);

        var items = list.Select(s => new
        {
            s.Id,
            s.Type,
            s.Status,
            s.Domain,
            s.Name,
            s.Email,
            s.Message,
            s.UploadedBy,
            s.CreatedAt,
            repliesCount = replyMap.TryGetValue(s.Id, out var c) ? c : 0,
            fields = fields.Where(f => f.SubmissionId == s.Id).Select(f => new { f.Name, f.Value }),
            files = files.Where(f => f.SubmissionId == s.Id).Select(f => new { f.Id, f.FileName, f.ContentType, f.Size })
        });

        return Ok(new { total, page, pageSize, items });
    }

    [HttpGet("{id:guid}")]
    [Authorize(Roles = "Admin,Inbox")]
    public async Task<IActionResult> GetOne([FromRoute] Guid id)
    {
        var s = await _db.Submissions.AsNoTracking().FirstOrDefaultAsync(x => x.Id == id);
        if (s == null) return NotFound();

        var fields = await _db.SubmissionFields.AsNoTracking()
            .Where(f => f.SubmissionId == id)
            .Select(f => new { f.Name, f.Value })
            .ToListAsync();

        var files = await _db.SubmissionFiles.AsNoTracking()
            .Where(f => f.SubmissionId == id)
            .Select(f => new { f.Id, f.FileName, f.ContentType, f.Size })
            .ToListAsync();

        var replies = await _db.SubmissionReplies.AsNoTracking()
            .Where(r => r.SubmissionId == id)
            .OrderByDescending(r => r.SentAt)
            .Select(r => new { r.Id, r.ToEmail, r.Subject, r.Body, r.SentAt, r.SentBy })
            .ToListAsync();

        return Ok(new
        {
            s.Id,
            s.Type,
            s.Status,
            s.Domain,
            s.Name,
            s.Email,
            s.Message,
            s.UploadedBy,
            s.CreatedAt,
            fields,
            files,
            replies
        });
    }

    // =========================================
    // Inbox actions: Admin + Inbox (status/reply)
    // =========================================
    [HttpPut("{id:guid}/status")]
    [Authorize(Roles = "Admin,Inbox")]
    public async Task<IActionResult> UpdateStatus([FromRoute] Guid id, [FromBody] UpdateStatusRequest req)
    {
        var s = await _db.Submissions.FirstOrDefaultAsync(x => x.Id == id);
        if (s == null) return NotFound();

        if (req.Status != SubmissionStatus.Unread &&
            req.Status != SubmissionStatus.Read &&
            req.Status != SubmissionStatus.InProgress &&
            req.Status != SubmissionStatus.Done)
            return BadRequest("Status must be Unread, Read, InProgress, or Done.");

        if (s.Status == SubmissionStatus.Accepted || s.Status == SubmissionStatus.Rejected)
            return BadRequest("Cannot change status after Accept/Reject.");

        s.Status = req.Status;
        await _db.SaveChangesAsync();
        return Ok();
    }

    [HttpPost("{id:guid}/reply")]
    [Authorize(Roles = "Admin,Inbox")]
    public async Task<IActionResult> Reply([FromRoute] Guid id, [FromBody] ReplyRequest req)
    {
        var submission = await _db.Submissions.AsNoTracking().FirstOrDefaultAsync(x => x.Id == id);
        if (submission == null) return NotFound();

        var toEmail = (req.ToEmail ?? "").Trim();
        var subject = (req.Subject ?? "").Trim();
        var body = (req.Body ?? "").Trim();

        if (toEmail.Length == 0 || subject.Length == 0 || body.Length == 0)
            return BadRequest("ToEmail, Subject and Body are required.");

        await _email.SendAsync(toEmail, subject, body);

        var sentBy = User?.Identity?.Name ?? "";
        if (string.IsNullOrWhiteSpace(sentBy))
            sentBy = User?.Claims?.FirstOrDefault(c => c.Type.EndsWith("/name", StringComparison.OrdinalIgnoreCase))?.Value ?? "";

        var reply = new SubmissionReply
        {
            Id = Guid.NewGuid(),
            SubmissionId = id,
            ToEmail = toEmail,
            Subject = subject,
            Body = body,
            SentAt = DateTime.UtcNow,
            SentBy = string.IsNullOrWhiteSpace(sentBy) ? "unknown" : sentBy
        };

        _db.SubmissionReplies.Add(reply);
        await _db.SaveChangesAsync();

        var replies = await _db.SubmissionReplies.AsNoTracking()
            .Where(r => r.SubmissionId == id)
            .OrderByDescending(r => r.SentAt)
            .Select(r => new { r.Id, r.ToEmail, r.Subject, r.Body, r.SentAt, r.SentBy })
            .ToListAsync();

        return Ok(new { replies });
    }

    [HttpGet("{id:guid}/files/{fileId:guid}/download")]
    [Authorize(Roles = "Admin,Inbox")]
    public async Task<IActionResult> Download([FromRoute] Guid id, [FromRoute] Guid fileId)
    {
        var file = await _db.SubmissionFiles.AsNoTracking()
            .FirstOrDefaultAsync(x => x.Id == fileId && x.SubmissionId == id);

        if (file == null) return NotFound();

        var privateRoot = Path.Combine(_env.ContentRootPath, "uploads_private");
        var fullPath = Path.Combine(privateRoot, file.FilePath.Replace("/", Path.DirectorySeparatorChar.ToString()));

        if (!System.IO.File.Exists(fullPath))
            return NotFound();

        var bytes = await System.IO.File.ReadAllBytesAsync(fullPath);
        return File(bytes, file.ContentType ?? "application/octet-stream", file.FileName);
    }

    // =========================
    // Admin-only destructive ops
    // =========================
    [HttpDelete("{id:guid}")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> Delete([FromRoute] Guid id)
    {
        var submission = await _db.Submissions.FirstOrDefaultAsync(x => x.Id == id);
        if (submission == null) return NotFound();

        var files = await _db.SubmissionFiles.Where(f => f.SubmissionId == id).ToListAsync();
        var fields = await _db.SubmissionFields.Where(f => f.SubmissionId == id).ToListAsync();
        var replies = await _db.SubmissionReplies.Where(r => r.SubmissionId == id).ToListAsync();

        if (replies.Count > 0) _db.SubmissionReplies.RemoveRange(replies);
        if (fields.Count > 0) _db.SubmissionFields.RemoveRange(fields);
        if (files.Count > 0) _db.SubmissionFiles.RemoveRange(files);

        _db.Submissions.Remove(submission);
        await _db.SaveChangesAsync();

        try
        {
            var privateRoot = Path.Combine(_env.ContentRootPath, "uploads_private");
            var dir = Path.Combine(privateRoot, "submissions", id.ToString("N"));
            if (Directory.Exists(dir))
            {
                Directory.Delete(dir, true);
            }
        }
        catch
        {
        }

        return NoContent();
    }

    [HttpPut("{id:guid}/accept")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> Accept([FromRoute] Guid id)
    {
        var s = await _db.Submissions.FirstOrDefaultAsync(x => x.Id == id);
        if (s == null) return NotFound();

        if (s.Type != SubmissionType.DemoUpload)
            return BadRequest("Accept/Reject is only for DemoUpload.");

        s.Status = SubmissionStatus.Accepted;
        await _db.SaveChangesAsync();
        return Ok();
    }

    [HttpPut("{id:guid}/reject")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> Reject([FromRoute] Guid id)
    {
        var s = await _db.Submissions.FirstOrDefaultAsync(x => x.Id == id);
        if (s == null) return NotFound();

        if (s.Type != SubmissionType.DemoUpload)
            return BadRequest("Accept/Reject is only for DemoUpload.");

        var fields = await _db.SubmissionFields.AsNoTracking()
            .Where(f => f.SubmissionId == id)
            .ToListAsync();

        var artistName = ExtractArtistName(s, fields);
        var trackTitle = ExtractTrackTitle(fields);

        var body = BuildDemoRejectionBody(artistName, trackTitle);

        var existing = await _db.SubmissionFields.FirstOrDefaultAsync(x => x.SubmissionId == id && x.Name == "autoRejectionBody");
        if (existing == null)
        {
            _db.SubmissionFields.Add(new SubmissionField
            {
                Id = Guid.NewGuid(),
                SubmissionId = id,
                Name = "autoRejectionBody",
                Value = body
            });
        }
        else
        {
            existing.Value = body;
        }

        s.Status = SubmissionStatus.Rejected;
        await _db.SaveChangesAsync();

        return Ok(new { body });
    }

    [HttpGet("export")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> Export(
        [FromQuery] SubmissionStatus? status,
        [FromQuery] SubmissionType? type,
        [FromQuery] DateTime? from,
        [FromQuery] DateTime? to)
    {
        IQueryable<Submission> query = _db.Submissions.AsNoTracking();

        if (status.HasValue)
            query = query.Where(s => s.Status == status.Value);

        if (type.HasValue)
            query = query.Where(s => s.Type == type.Value);

        if (from.HasValue)
            query = query.Where(s => s.CreatedAt >= from.Value);

        if (to.HasValue)
            query = query.Where(s => s.CreatedAt <= to.Value);

        var rows = await query.OrderByDescending(x => x.CreatedAt).Take(5000).ToListAsync();
        var ids = rows.Select(r => r.Id).ToList();

        var filesCount = await _db.SubmissionFiles.AsNoTracking()
            .Where(f => ids.Contains(f.SubmissionId))
            .GroupBy(f => f.SubmissionId)
            .Select(g => new { SubmissionId = g.Key, Count = g.Count() })
            .ToListAsync();

        var map = filesCount.ToDictionary(x => x.SubmissionId, x => x.Count);

        static string Csv(string? v)
        {
            v ??= "";
            v = v.Replace("\"", "\"\"");
            return $"\"{v}\"";
        }

        var sb = new StringBuilder();
        sb.AppendLine("Id,Name,Email,Type,Status,Domain,UploadedBy,HasFiles,Message,CreatedAt");

        foreach (var s in rows)
        {
            var has = map.TryGetValue(s.Id, out var c) ? c : 0;
            sb.AppendLine(string.Join(",", new[]
            {
                Csv(s.Id.ToString()),
                Csv(s.Name),
                Csv(s.Email),
                Csv(s.Type.ToString()),
                Csv(s.Status.ToString()),
                Csv(s.Domain),
                Csv(s.UploadedBy),
                Csv(has > 0 ? "yes" : "no"),
                Csv(s.Message),
                Csv(s.CreatedAt.ToString("o"))
            }));
        }

        var utf8WithBom = new UTF8Encoding(true);
        return File(utf8WithBom.GetBytes(sb.ToString()), "text/csv", $"submissions_{DateTime.UtcNow:yyyyMMddHHmm}.csv");
    }

    private List<string> ResolveNotificationRecipients(SubmissionType type)
    {
        var shared = (_config["Notifications:SharedInbox"] ?? "").Trim();
        var publishing = (_config["Notifications:Publishing"] ?? "").Trim();
        var support = (_config["Notifications:Support"] ?? "").Trim();
        var info = (_config["Notifications:Info"] ?? "").Trim();
        var legal = (_config["Notifications:Legal"] ?? "").Trim();

        var list = new List<string>();

        if (!string.IsNullOrWhiteSpace(shared))
            list.Add(shared);

        string extra = type switch
        {
            SubmissionType.DemoUpload => shared,
            SubmissionType.ArtistInformation => publishing,
            SubmissionType.SongwriterInformation => publishing,
            SubmissionType.SyncRequest => publishing,
            SubmissionType.GeneralContactInquiry => info,
            SubmissionType.SupportForm => support,
            _ => ""
        };

        if (type == SubmissionType.SyncRequest && !string.IsNullOrWhiteSpace(legal))
            list.Add(legal);

        if (!string.IsNullOrWhiteSpace(extra))
            list.Add(extra);

        return list
            .Where(x => !string.IsNullOrWhiteSpace(x))
            .Select(x => x.Trim())
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .ToList();
    }

    private static string BuildInternalSubject(Submission s)
    {
        var domain = string.IsNullOrWhiteSpace(s.Domain) ? "unknown-domain" : s.Domain;
        return $"New {s.Type} submission [{domain}] ({s.Id})";
    }

    private static string BuildInternalBody(Submission s, Dictionary<string, string> fields, List<SubmissionFile> files)
    {
        var sb = new StringBuilder();

        sb.AppendLine($"Reference ID: {s.Id}");
        sb.AppendLine($"Type: {s.Type}");
        sb.AppendLine($"Status: {s.Status}");
        sb.AppendLine($"Domain: {s.Domain}");
        sb.AppendLine($"Name: {s.Name}");
        sb.AppendLine($"Email: {s.Email}");
        sb.AppendLine($"UploadedBy: {s.UploadedBy ?? ""}");
        sb.AppendLine($"CreatedAt (UTC): {s.CreatedAt:O}");
        sb.AppendLine();

        if (!string.IsNullOrWhiteSpace(s.Message))
        {
            sb.AppendLine("Message:");
            sb.AppendLine(s.Message);
            sb.AppendLine();
        }

        if (fields.Count > 0)
        {
            sb.AppendLine("Fields:");
            foreach (var kv in fields)
            {
                var k = (kv.Key ?? "").Trim();
                if (k.Length == 0) continue;
                sb.AppendLine($"{k}: {(kv.Value ?? "").Trim()}");
            }
            sb.AppendLine();
        }

        if (files.Count > 0)
        {
            sb.AppendLine("Files:");
            foreach (var f in files)
                sb.AppendLine($"{f.FileName} ({f.ContentType}, {f.Size} bytes)");
            sb.AppendLine();
        }

        sb.AppendLine("This is an automated notification.");
        return sb.ToString();
    }

    private static string ExtractArtistName(Submission s, List<SubmissionField> fields)
    {
        var name = (s.Name ?? "").Trim();
        if (name.Length > 0) return name;

        var candidate = FindField(fields, "artistName", "artist", "name");
        return string.IsNullOrWhiteSpace(candidate) ? "there" : candidate.Trim();
    }

    private static string ExtractTrackTitle(List<SubmissionField> fields)
    {
        var candidate = FindField(fields, "trackTitle", "track", "title", "songTitle", "song");
        return string.IsNullOrWhiteSpace(candidate) ? "your track" : candidate.Trim();
    }

    private static string? FindField(List<SubmissionField> fields, params string[] keys)
    {
        foreach (var key in keys)
        {
            var f = fields.FirstOrDefault(x => string.Equals(x.Name, key, StringComparison.OrdinalIgnoreCase));
            if (f != null && !string.IsNullOrWhiteSpace(f.Value))
                return f.Value;
        }
        return null;
    }

    private static string BuildDemoRejectionBody(string artistName, string trackTitle)
    {
        var sb = new StringBuilder();
        sb.AppendLine($"Hi {artistName},");
        sb.AppendLine();
        sb.AppendLine($"Thank you for sending {trackTitle}. After careful consideration, we have decided not to move forward with a release for this track.");
        sb.AppendLine();
        sb.AppendLine("Due to the volume of submissions we receive, we can’t always provide detailed feedback, but we truly appreciate you sharing your work with us. Please don’t hesitate to send future demos, We are always keen to hear what you are working on next.");
        sb.AppendLine();
        sb.AppendLine("Wishing you the best,");
        sb.AppendLine("Your Purple Crunch Records Team");
        return sb.ToString();
    }
}

public class SubmissionCreateForm
{
    public SubmissionType? Type { get; set; }
    public string? Domain { get; set; }
    public string Name { get; set; } = "";
    public string Email { get; set; } = "";
    public string? Message { get; set; }
    public string? UploadedBy { get; set; }
    public string? FieldsJson { get; set; }
    public List<IFormFile>? Files { get; set; }
}

public class UpdateStatusRequest
{
    public SubmissionStatus Status { get; set; }
}

public class ReplyRequest
{
    public string? ToEmail { get; set; }
    public string? Subject { get; set; }
    public string? Body { get; set; }
}
