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

        if (!form.Type.HasValue)
            return BadRequest("Submission Type is required.");

        if (!form.PrivacyAccepted)
            return BadRequest("Privacy policy must be accepted.");

        var type = form.Type.Value;

        if ((type == SubmissionType.GeneralContactInquiry
             || type == SubmissionType.SupportForm
             || type == SubmissionType.LegalRequest)
            && string.IsNullOrWhiteSpace(form.Message))
        {
            return BadRequest("Message is required.");
        }

        Dictionary<string, string> dict = new(StringComparer.OrdinalIgnoreCase);
        if (!string.IsNullOrWhiteSpace(form.FieldsJson))
        {
            try
            {
                dict = JsonSerializer.Deserialize<Dictionary<string, string>>(
                    form.FieldsJson,
                    new JsonSerializerOptions { PropertyNameCaseInsensitive = true }
                ) ?? new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase);
            }
            catch
            {
                return BadRequest("fieldsJson must be a JSON object.");
            }
        }

        static string Get(Dictionary<string, string> d, string key) =>
            d.TryGetValue(key, out var v) ? (v ?? "").Trim() : "";

        static bool LooksLikeFullName(string s)
        {
            s = (s ?? "").Trim();
            var parts = s.Split(' ', StringSplitOptions.RemoveEmptyEntries);
            return parts.Length >= 2;
        }

        static int? ComputeAgeFromIso(string iso)
        {
            if (string.IsNullOrWhiteSpace(iso)) return null;
            if (!DateTime.TryParse(iso, out var dob)) return null;
            var now = DateTime.UtcNow.Date;
            var age = now.Year - dob.Year;
            if (dob.Date > now.AddYears(-age)) age--;
            return age;
        }

        if (type == SubmissionType.SongwriterInformation)
        {
            var fullLegalName = Get(dict, "fullLegalName");
            var dob = Get(dict, "dateOfBirth");

            if (string.IsNullOrWhiteSpace(fullLegalName) || !LooksLikeFullName(fullLegalName))
                return BadRequest("Full legal name is required and must look like a full name.");

            if (string.IsNullOrWhiteSpace(dob))
                return BadRequest("Date of birth is required for SongwriterInformation.");

            var age = ComputeAgeFromIso(dob);
            if (age is null)
                return BadRequest("Date of birth is invalid.");

            if (age < 18)
            {
                var guardianName = Get(dict, "guardianName");
                var guardianEmail = Get(dict, "guardianEmail");

                if (!LooksLikeFullName(guardianName) || guardianEmail.Length == 0)
                    return BadRequest("For minors, guardianName and guardianEmail are required for SongwriterInformation.");
            }
        }

        if (type == SubmissionType.ArtistInformation)
        {
            var fullLegalName = Get(dict, "fullLegalNameArtist");
            var dob = Get(dict, "dateOfBirthArtist");

            if (string.IsNullOrWhiteSpace(fullLegalName) || !LooksLikeFullName(fullLegalName))
                return BadRequest("Full legal name is required and must look like a full name for ArtistInformation.");

            if (string.IsNullOrWhiteSpace(dob))
                return BadRequest("Date of birth is required for ArtistInformation.");

            var age = ComputeAgeFromIso(dob);
            if (age is null)
                return BadRequest("Date of birth is invalid.");

            if (age < 18)
            {
                var guardianName = Get(dict, "guardianNameArtist");
                var guardianEmail = Get(dict, "guardianEmailArtist");

                if (!LooksLikeFullName(guardianName) || guardianEmail.Length == 0)
                    return BadRequest("For minors, guardianNameArtist and guardianEmailArtist are required for ArtistInformation.");
            }
        }

        if (type == SubmissionType.DemoUpload)
        {
            if (form.Files == null || form.Files.Count == 0)
                return BadRequest("At least one demo file must be uploaded.");

            static bool IsWav(IFormFile f)
            {
                var ext = Path.GetExtension(f.FileName ?? "").ToLowerInvariant();
                var nameOk = ext is ".wav";
                var ct = (f.ContentType ?? "").ToLowerInvariant();
                var typeOk = ct == "audio/wav" || ct == "audio/x-wav" || ct == "audio/wave";
                return nameOk || typeOk;
            }

            static bool IsAllowedImage(IFormFile f)
            {
                var ext = Path.GetExtension(f.FileName ?? "").ToLowerInvariant();
                var nameOk = ext is ".png" or ".jpg" or ".jpeg";
                var ct = (f.ContentType ?? "").ToLowerInvariant();
                var typeOk = ct == "image/png" || ct == "image/jpeg";
                return nameOk || typeOk;
            }

            static bool IsAllowedUpload(IFormFile f) => IsWav(f) || IsAllowedImage(f);

            if (form.Files != null && form.Files.Count > 0)
            {
                foreach (var f in form.Files)
                {
                    if (!IsAllowedUpload(f))
                        return BadRequest("Only .wav and image files (png/jpg/jpeg) are allowed.");
                }
            }
        }

        var submission = new Submission
        {
            Id = Guid.NewGuid(),
            Type = type,
            Status = SubmissionStatus.Unread,
            Domain = string.IsNullOrWhiteSpace(form.Domain) ? "unknown" : form.Domain.Trim(),
            Name = form.Name.Trim(),
            Email = form.Email.Trim(),
            Message = string.IsNullOrWhiteSpace(form.Message) ? null : form.Message.Trim(),
            UploadedBy = string.IsNullOrWhiteSpace(form.UploadedBy) ? null : form.UploadedBy.Trim()
        };

        _db.Submissions.Add(submission);

        var fieldsToInsert = new List<SubmissionField>();

        foreach (var kv in dict)
        {
            var key = (kv.Key ?? "").Trim();
            if (key.Length == 0) continue;

            fieldsToInsert.Add(new SubmissionField
            {
                Id = Guid.NewGuid(),
                SubmissionId = submission.Id,
                Name = key,
                Value = kv.Value ?? ""
            });
        }

        if (fieldsToInsert.Count > 0)
        {
            _db.SubmissionFields.AddRange(fieldsToInsert);
        }

        if (form.Files != null && form.Files.Count > 0)
        {
            var uploadsRoot = Path.Combine(_env.ContentRootPath, "Uploads");
            Directory.CreateDirectory(uploadsRoot);

            foreach (var file in form.Files)
            {
                if (file.Length <= 0) continue;

                var ext = Path.GetExtension(file.FileName ?? "").ToLowerInvariant();
                var safeName = Path.GetFileNameWithoutExtension(file.FileName ?? "");
                if (string.IsNullOrWhiteSpace(safeName))
                    safeName = "upload";

                var newName = $"{safeName}_{Guid.NewGuid():N}{ext}";
                var filePath = Path.Combine(uploadsRoot, newName);

                using (var stream = System.IO.File.Create(filePath))
                {
                    await file.CopyToAsync(stream);
                }

                _db.SubmissionFiles.Add(new SubmissionFile
                {
                    Id = Guid.NewGuid(),
                    SubmissionId = submission.Id,
                    FileName = file.FileName ?? newName,
                    FilePath = filePath,
                    ContentType = file.ContentType ?? "application/octet-stream",
                    Size = file.Length
                });
            }
        }

        // AUDIT: kreiranje prijave (public user)
        _db.AuditLogs.Add(new AuditLog
        {
            Id = Guid.NewGuid(),
            CreatedAtUtc = DateTime.UtcNow,
            UserEmail = "public-form",
            Action = "SUBMISSION_CREATE",
            EntityType = "Submission",
            EntityId = submission.Id.ToString(),
            Details = $"Type={submission.Type}; Domain={submission.Domain}; Email={submission.Email}"
        });

        await _db.SaveChangesAsync();

        try
        {
            var recipients = ResolveNotificationRecipients(submission.Type);

            if (recipients.Count > 0)
            {
                var subject = BuildInternalSubject(submission);
                var body = BuildInternalBody(submission, dict);

                foreach (var r in recipients)
                {
                    await _email.SendAsync(r, subject, body);
                }
            }
        }
        catch
        {
        }

        return Ok(new { submission.Id, submission.Type, submission.Status });
    }

    [HttpGet]
    [Authorize(Roles = "Admin,Inbox")]
    public async Task<IActionResult> GetAll(
        [FromQuery] string? search,
        [FromQuery] string? domain,
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

        var q = _db.Submissions.AsNoTracking().AsQueryable();

        if (!string.IsNullOrWhiteSpace(search))
        {
            var s = search.Trim();
            q = q.Where(x =>
                x.Name.Contains(s) ||
                x.Email.Contains(s) ||
                (x.Message != null && x.Message.Contains(s)));
        }

        if (!string.IsNullOrWhiteSpace(domain))
        {
            var d = domain.Trim();
            q = q.Where(x => x.Domain == d);
        }

        if (status.HasValue)
        {
            q = q.Where(x => x.Status == status.Value);
        }

        if (type.HasValue)
        {
            q = q.Where(x => x.Type == type.Value);
        }

        if (from.HasValue)
        {
            var fromDate = from.Value.Date;
            q = q.Where(x => x.CreatedAt >= fromDate);
        }

        if (to.HasValue)
        {
            var toDate = to.Value.Date.AddDays(1);
            q = q.Where(x => x.CreatedAt < toDate);
        }

        if (hasFile.HasValue)
        {
            var submitIdsWithFiles = _db.SubmissionFiles.AsNoTracking()
                .GroupBy(f => f.SubmissionId)
                .Select(g => new { g.Key, Count = g.Count() });

            if (hasFile.Value)
            {
                q = q.Join(submitIdsWithFiles.Where(x => x.Count > 0),
                        s => s.Id, f => f.Key, (s, _) => s);
            }
            else
            {
                q = q.GroupJoin(submitIdsWithFiles,
                        s => s.Id, f => f.Key,
                        (s, gj) => new { s, gj })
                    .SelectMany(x => x.gj.DefaultIfEmpty(), (x, f) => new { x.s, f })
                    .Where(x => x.f == null || x.f.Count == 0)
                    .Select(x => x.s);
            }
        }

        var total = await q.CountAsync();

        var submissions = await q
            .OrderByDescending(x => x.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();

        var ids = submissions.Select(x => x.Id).ToList();

        var fields = await _db.SubmissionFields.AsNoTracking()
            .Where(f => ids.Contains(f.SubmissionId))
            .ToListAsync();

        var files = await _db.SubmissionFiles.AsNoTracking()
            .Where(f => ids.Contains(f.SubmissionId))
            .ToListAsync();

        var repliesCount = await _db.SubmissionReplies.AsNoTracking()
            .Where(r => ids.Contains(r.SubmissionId))
            .GroupBy(r => r.SubmissionId)
            .Select(g => new { SubmissionId = g.Key, Count = g.Count() })
            .ToListAsync();

        var replyMap = repliesCount.ToDictionary(x => x.SubmissionId, x => x.Count);

        var items = submissions.Select(s => new
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

        return Ok(new { totalCount = total, page, pageSize, items });
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

    [HttpGet("{id:guid}/export")]
    [Authorize(Roles = "Admin,Inbox")]
    public async Task<IActionResult> ExportOne([FromRoute] Guid id)
    {
        var s = await _db.Submissions.AsNoTracking()
            .FirstOrDefaultAsync(x => x.Id == id);

        if (s == null) return NotFound();

        var fields = await _db.SubmissionFields.AsNoTracking()
            .Where(f => f.SubmissionId == id)
            .ToListAsync();

        var files = await _db.SubmissionFiles.AsNoTracking()
            .Where(f => f.SubmissionId == id)
            .ToListAsync();

        var replies = await _db.SubmissionReplies.AsNoTracking()
            .Where(r => r.SubmissionId == id)
            .OrderByDescending(r => r.SentAt)
            .ToListAsync();

        static string Csv(string? v)
        {
            v ??= "";
            v = v.Replace("\"", "\"\"");
            return $"\"{v}\"";
        }

        var sb = new StringBuilder();

        // Sekcija 1: osnovni podaci
        sb.AppendLine("Section,Key,Value");
        sb.AppendLine($"Submission,Id,{Csv(s.Id.ToString())}");
        sb.AppendLine($"Submission,CreatedAt,{Csv(s.CreatedAt.ToString("yyyy-MM-dd HH:mm:ss"))}");
        sb.AppendLine($"Submission,Type,{Csv(s.Type.ToString())}");
        sb.AppendLine($"Submission,Status,{Csv(s.Status.ToString())}");
        sb.AppendLine($"Submission,Domain,{Csv(s.Domain)}");
        sb.AppendLine($"Submission,Name,{Csv(s.Name)}");
        sb.AppendLine($"Submission,Email,{Csv(s.Email)}");
        sb.AppendLine($"Submission,UploadedBy,{Csv(s.UploadedBy)}");
        sb.AppendLine($"Submission,Message,{Csv(s.Message)}");
        sb.AppendLine();

     
        sb.AppendLine("Section,FieldName,FieldValue");
        foreach (var f in fields)
        {
            sb.AppendLine($"Field,{Csv(f.Name)},{Csv(f.Value)}");
        }
        sb.AppendLine();

       
        sb.AppendLine("Section,FileName,ContentType,SizeBytes");
        foreach (var f in files)
        {
            sb.AppendLine($"File,{Csv(f.FileName)},{Csv(f.ContentType)},{Csv(f.Size.ToString())}");
        }
        sb.AppendLine();

      
        sb.AppendLine("Section,ToEmail,Subject,Body,SentAt,SentBy");
        foreach (var r in replies)
        {
            sb.Append("Reply,");
            sb.Append(Csv(r.ToEmail));
            sb.Append(',');
            sb.Append(Csv(r.Subject));
            sb.Append(',');
            sb.Append(Csv(r.Body));
            sb.Append(',');
            sb.Append(Csv(r.SentAt.ToString("yyyy-MM-dd HH:mm:ss")));
            sb.Append(',');
            sb.Append(Csv(r.SentBy));
            sb.AppendLine();
        }

        var utf8WithBom = new UTF8Encoding(true);
        var bytes = utf8WithBom.GetBytes(sb.ToString());

        return File(bytes, "text/csv", $"submission_{id:yyyyMMddHHmmss}.csv");
    }


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

        var email = User?.Identity?.Name ?? User?.FindFirst("email")?.Value ?? "";

        _db.AuditLogs.Add(new AuditLog
        {
            Id = Guid.NewGuid(),
            CreatedAtUtc = DateTime.UtcNow,
            UserEmail = email ?? "",
            Action = "SUBMISSION_STATUS_CHANGE",
            EntityType = "Submission",
            EntityId = id.ToString(),
            Details = $"Status set to {req.Status}"
        });

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

        var sentBy = User?.Identity?.Name ?? User?.FindFirst("email")?.Value ?? "unknown";

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

        _db.AuditLogs.Add(new AuditLog
        {
            Id = Guid.NewGuid(),
            CreatedAtUtc = DateTime.UtcNow,
            UserEmail = sentBy,
            Action = "SUBMISSION_REPLY",
            EntityType = "Submission",
            EntityId = id.ToString(),
            Details = $"Reply to {toEmail} with subject '{subject}'"
        });

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
    public async Task<IActionResult> DownloadFile([FromRoute] Guid id, [FromRoute] Guid fileId)
    {
        var file = await _db.SubmissionFiles.AsNoTracking()
            .FirstOrDefaultAsync(f => f.Id == fileId && f.SubmissionId == id);

        if (file == null) return NotFound();

        if (!System.IO.File.Exists(file.FilePath))
            return NotFound("File not found.");

        // AUDIT DOWNLOAD
        var email = User?.Identity?.Name ?? User?.FindFirst("email")?.Value ?? "";

        _db.AuditLogs.Add(new AuditLog
        {
            Id = Guid.NewGuid(),
            CreatedAtUtc = DateTime.UtcNow,
            UserEmail = email ?? "",
            Action = "SUBMISSION_FILE_DOWNLOAD",
            EntityType = "SubmissionFile",
            EntityId = file.Id.ToString(),
            Details = $"Downloaded file '{file.FileName}' for submission {id}"
        });

        await _db.SaveChangesAsync();

        var bytes = await System.IO.File.ReadAllBytesAsync(file.FilePath);
        return File(bytes, file.ContentType, file.FileName);
    }


    [HttpDelete("{id:guid}")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> Delete([FromRoute] Guid id)
    {
        var s = await _db.Submissions.FirstOrDefaultAsync(x => x.Id == id);
        if (s == null) return NotFound();

        var files = await _db.SubmissionFiles.Where(f => f.SubmissionId == id).ToListAsync();
        var fields = await _db.SubmissionFields.Where(f => f.SubmissionId == id).ToListAsync();
        var replies = await _db.SubmissionReplies.Where(r => r.SubmissionId == id).ToListAsync();

        _db.SubmissionFiles.RemoveRange(files);
        _db.SubmissionFields.RemoveRange(fields);
        _db.SubmissionReplies.RemoveRange(replies);
        _db.Submissions.Remove(s);

        var email = User?.Identity?.Name ?? User?.FindFirst("email")?.Value ?? "";

        _db.AuditLogs.Add(new AuditLog
        {
            Id = Guid.NewGuid(),
            CreatedAtUtc = DateTime.UtcNow,
            UserEmail = email ?? "",
            Action = "SUBMISSION_DELETE",
            EntityType = "Submission",
            EntityId = id.ToString(),
            Details = $"Submission deleted with {files.Count} files, {fields.Count} fields, {replies.Count} replies"
        });

        await _db.SaveChangesAsync();

        foreach (var f in files)
        {
            try
            {
                if (System.IO.File.Exists(f.FilePath))
                    System.IO.File.Delete(f.FilePath);
            }
            catch
            {
            }
        }

        return Ok();
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

        var email = User?.Identity?.Name ?? User?.FindFirst("email")?.Value ?? "";

        _db.AuditLogs.Add(new AuditLog
        {
            Id = Guid.NewGuid(),
            CreatedAtUtc = DateTime.UtcNow,
            UserEmail = email ?? "",
            Action = "SUBMISSION_ACCEPT",
            EntityType = "Submission",
            EntityId = id.ToString(),
            Details = "Demo accepted"
        });

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

        var fields = await _db.SubmissionFields
            .Where(f => f.SubmissionId == id)
            .ToListAsync();

        string GetField(string name)
        {
            var f = fields.FirstOrDefault(x => x.Name.Equals(name, StringComparison.OrdinalIgnoreCase));
            return f?.Value ?? "";
        }

        var artistName = GetField("artistName");
        var trackTitle = GetField("trackTitle");

        if (string.IsNullOrWhiteSpace(artistName))
        {
            artistName = s.Name;
        }

        if (string.IsNullOrWhiteSpace(trackTitle))
        {
            trackTitle = "your track";
        }

        var body =
$@"Hi {artistName},
Thank you for sending {trackTitle}. After careful consideration, we have decided not to move forward with a release for this track.
Due to the volume of submissions we receive, we can’t always provide detailed feedback, but we truly appreciate you sharing your work with us. Please don’t hesitate to send future demos, We are always keen to hear what you are working on next.
Wishing you the best,
Your Purple Crunch Records Team";

        var existing = fields.FirstOrDefault(x => x.Name == "autoRejectionBody");
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

        var email = User?.Identity?.Name ?? User?.FindFirst("email")?.Value ?? "";

        _db.AuditLogs.Add(new AuditLog
        {
            Id = Guid.NewGuid(),
            CreatedAtUtc = DateTime.UtcNow,
            UserEmail = email ?? "",
            Action = "SUBMISSION_REJECT",
            EntityType = "Submission",
            EntityId = id.ToString(),
            Details = "Demo rejected with auto body"
        });

        await _db.SaveChangesAsync();

        return Ok(new { body });
    }

    [HttpGet("export")]
    [Authorize(Roles = "Admin,Inbox")]
    public async Task<IActionResult> Export(
        [FromQuery] string? search,
        [FromQuery] string? domain,
        [FromQuery] SubmissionStatus? status,
        [FromQuery] SubmissionType? type,
        [FromQuery] DateTime? from,
        [FromQuery] DateTime? to,
        [FromQuery] bool? hasFile)
    {
        var q = _db.Submissions.AsNoTracking().AsQueryable();

        if (!string.IsNullOrWhiteSpace(search))
        {
            var s = search.Trim();
            q = q.Where(x =>
                x.Name.Contains(s) ||
                x.Email.Contains(s) ||
                (x.Message != null && x.Message.Contains(s)));
        }

        if (!string.IsNullOrWhiteSpace(domain))
        {
            var d = domain.Trim();
            q = q.Where(x => x.Domain == d);
        }

        if (status.HasValue)
        {
            q = q.Where(x => x.Status == status.Value);
        }

        if (type.HasValue)
        {
            q = q.Where(x => x.Type == type.Value);
        }

        if (from.HasValue)
        {
            var fromDate = from.Value.Date;
            q = q.Where(x => x.CreatedAt >= fromDate);
        }

        if (to.HasValue)
        {
            var toDate = to.Value.Date.AddDays(1);
            q = q.Where(x => x.CreatedAt < toDate);
        }

        if (hasFile.HasValue)
        {
            var submitIdsWithFiles = _db.SubmissionFiles.AsNoTracking()
                .GroupBy(f => f.SubmissionId)
                .Select(g => new { g.Key, Count = g.Count() });

            if (hasFile.Value)
            {
                q = q.Join(submitIdsWithFiles.Where(x => x.Count > 0),
                        s => s.Id, f => f.Key, (s, _) => s);
            }
            else
            {
                q = q.GroupJoin(submitIdsWithFiles,
                        s => s.Id, f => f.Key,
                        (s, gj) => new { s, gj })
                    .SelectMany(x => x.gj.DefaultIfEmpty(), (x, f) => new { x.s, f })
                    .Where(x => x.f == null || x.f.Count == 0)
                    .Select(x => x.s);
            }
        }

        var list = await q.OrderByDescending(x => x.CreatedAt).ToListAsync();
        var ids = list.Select(x => x.Id).ToList();

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

        sb.AppendLine("Id,CreatedAt,Type,Status,Domain,Name,Email,UploadedBy,Message,FilesCount");

        foreach (var s in list)
        {
            map.TryGetValue(s.Id, out var count);

            sb.Append(Csv(s.Id.ToString()));
            sb.Append(',');
            sb.Append(Csv(s.CreatedAt.ToString("yyyy-MM-dd HH:mm:ss")));
            sb.Append(',');
            sb.Append(Csv(s.Type.ToString()));
            sb.Append(',');
            sb.Append(Csv(s.Status.ToString()));
            sb.Append(',');
            sb.Append(Csv(s.Domain));
            sb.Append(',');
            sb.Append(Csv(s.Name));
            sb.Append(',');
            sb.Append(Csv(s.Email));
            sb.Append(',');
            sb.Append(Csv(s.UploadedBy));
            sb.Append(',');
            sb.Append(Csv(s.Message));
            sb.Append(',');
            sb.Append(Csv((count).ToString()));
            sb.AppendLine();
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
            SubmissionType.LegalRequest => legal,
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
        return $"New submission [{s.Type}] from {s.Name} ({domain})";
    }

    private static string BuildInternalBody(Submission s, IReadOnlyDictionary<string, string> dict)
    {
        var sb = new StringBuilder();

        sb.AppendLine($"Type: {s.Type}");
        sb.AppendLine($"Name: {s.Name}");
        sb.AppendLine($"Email: {s.Email}");
        sb.AppendLine($"Domain: {s.Domain}");
        sb.AppendLine($"UploadedBy: {s.UploadedBy}");
        sb.AppendLine($"CreatedAt: {s.CreatedAt:yyyy-MM-dd HH:mm:ss} UTC");
        sb.AppendLine();

        if (!string.IsNullOrWhiteSpace(s.Message))
        {
            sb.AppendLine("Message:");
            sb.AppendLine(s.Message);
            sb.AppendLine();
        }

        if (dict.Count > 0)
        {
            sb.AppendLine("Fields:");
            foreach (var kv in dict)
            {
                sb.AppendLine($"- {kv.Key}: {kv.Value}");
            }
            sb.AppendLine();
        }

        sb.AppendLine("This email was generated automatically by the Purple backend.");
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
    public bool PrivacyAccepted { get; set; }
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
