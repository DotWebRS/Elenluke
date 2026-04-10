using API.Hubs;
using API.Services;
using Domain.Entities;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;
using Persistence;
using System.Security.Claims;

namespace API.Controllers;

[ApiController]
[Route("api/chat")]
[Authorize]
public class ChatController : ControllerBase
{
    private readonly AppDbContext _db;
    private readonly IHubContext<NotificationsHub> _hub;
    private readonly IEmailSender _email;

    public ChatController(AppDbContext db, IHubContext<NotificationsHub> hub, IEmailSender email)
    {
        _db = db;
        _hub = hub;
        _email = email;
    }

    private string CurrentEmail() => User?.Identity?.Name ?? User?.FindFirst("email")?.Value ?? "";
    private string CurrentRole() => User?.FindFirst(ClaimTypes.Role)?.Value ?? User?.FindFirst("role")?.Value ?? "";

    private Guid? CurrentUserId()
    {
        var raw = User?.FindFirst("uid")?.Value;
        return Guid.TryParse(raw, out var id) ? id : null;
    }

    private async Task<bool> CanAccessSubmission(Guid submissionId)
    {
        var role = CurrentRole();

        if (role == "Admin" || role == "Editor" || role == "Inbox")
            return await _db.Submissions.AsNoTracking().AnyAsync(x => x.Id == submissionId);

        if (role == "PortalUser")
        {
            var uid = CurrentUserId();
            if (uid == null) return false;

            return await _db.SubmissionParticipants.AsNoTracking()
                .AnyAsync(x => x.SubmissionId == submissionId && x.UserId == uid.Value);
        }

        return false;
    }

    [HttpGet("my")]
    public async Task<IActionResult> MyChats()
    {
        var role = CurrentRole();
        IQueryable<Submission> q = _db.Submissions.AsNoTracking();

        if (role == "PortalUser")
        {
            var uid = CurrentUserId();
            if (uid == null) return Unauthorized();

            var allowed = _db.SubmissionParticipants.AsNoTracking()
                .Where(x => x.UserId == uid.Value)
                .Select(x => x.SubmissionId);

            q = q.Where(x => allowed.Contains(x.Id));
        }

        var submissions = await q.OrderByDescending(x => x.CreatedAt).ToListAsync();
        var ids = submissions.Select(x => x.Id).ToList();

        var lastMessages = await _db.SubmissionMessages.AsNoTracking()
            .Where(x => ids.Contains(x.SubmissionId) && (!x.IsInternal || role != "PortalUser"))
            .GroupBy(x => x.SubmissionId)
            .Select(g => g.OrderByDescending(x => x.CreatedAtUtc).First())
            .ToListAsync();

        return Ok(submissions.Select(s => new
        {
            s.Id,
            s.Type,
            s.Status,
            s.Name,
            s.Email,
            s.CreatedAt,
            lastMessage = lastMessages.Where(x => x.SubmissionId == s.Id)
                .Select(x => new { x.Body, x.CreatedAtUtc, x.SenderType, x.IsInternal })
                .FirstOrDefault()
        }));
    }

    [HttpGet("{submissionId:guid}/messages")]
    public async Task<IActionResult> GetMessages(Guid submissionId)
    {
        if (!await CanAccessSubmission(submissionId)) return Forbid();

        var role = CurrentRole();

        var messages = await _db.SubmissionMessages.AsNoTracking()
            .Where(x => x.SubmissionId == submissionId && (!x.IsInternal || role != "PortalUser"))
            .OrderBy(x => x.CreatedAtUtc)
            .Select(x => new
            {
                x.Id,
                x.SubmissionId,
                x.SenderType,
                x.SenderEmail,
                x.Body,
                x.IsInternal,
                x.CreatedAtUtc
            })
            .ToListAsync();

        return Ok(new { items = messages });
    }

    [HttpPost("{submissionId:guid}/participants")]
    [Authorize(Roles = "Admin,Editor")]
    public async Task<IActionResult> AddParticipant(Guid submissionId, [FromBody] AddParticipantRequest request)
    {
        var submission = await _db.Submissions.FirstOrDefaultAsync(x => x.Id == submissionId);
        if (submission == null) return NotFound();

        var user = await _db.Users.FirstOrDefaultAsync(x => x.Id == request.UserId && x.IsActive);
        if (user == null) return NotFound("User not found.");
        if (user.Role != "PortalUser") return BadRequest("Only PortalUser can be attached to a restricted chat.");

        var exists = await _db.SubmissionParticipants.AnyAsync(x => x.SubmissionId == submissionId && x.UserId == request.UserId);
        if (exists) return Ok(new { alreadyExists = true });

        _db.SubmissionParticipants.Add(new SubmissionParticipant
        {
            Id = Guid.NewGuid(),
            SubmissionId = submissionId,
            UserId = request.UserId,
            AddedAtUtc = DateTime.UtcNow,
            AddedByEmail = CurrentEmail()
        });

        _db.AuditLogs.Add(new AuditLog
        {
            Id = Guid.NewGuid(),
            CreatedAtUtc = DateTime.UtcNow,
            UserEmail = CurrentEmail(),
            Action = "CHAT_PARTICIPANT_ADD",
            EntityType = "Submission",
            EntityId = submissionId.ToString(),
            Details = $"Portal user {user.Email} added to restricted chat"
        });

        await _db.SaveChangesAsync();

        await _hub.Clients.Group($"user:{user.Id}")
            .SendAsync("submission_assigned", new { submissionId, submission.Name, submission.Email });

        return Ok(new { submissionId, userId = user.Id, user.Email });
    }

    [HttpPost("{submissionId:guid}/messages")]
    [EnableRateLimiting("chat-send-policy")]
    public async Task<IActionResult> SendMessage(Guid submissionId, [FromBody] SendMessageRequest request)
    {
        if (!await CanAccessSubmission(submissionId)) return Forbid();
        if (string.IsNullOrWhiteSpace(request.Body)) return BadRequest("Body is required.");

        var submission = await _db.Submissions.FirstOrDefaultAsync(x => x.Id == submissionId);
        if (submission == null) return NotFound();

        var role = CurrentRole();
        var senderEmail = CurrentEmail();
        var isInternal = request.IsInternal;

        if (role == "PortalUser" && isInternal)
            return BadRequest("PortalUser cannot create internal notes.");

        var senderType = role switch
        {
            "Admin" => "Admin",
            "Editor" => "Editor",
            "Inbox" => "Inbox",
            "PortalUser" => "PortalUser",
            _ => "System"
        };

        var msg = new SubmissionMessage
        {
            Id = Guid.NewGuid(),
            SubmissionId = submissionId,
            SenderType = senderType,
            SenderEmail = senderEmail,
            Body = request.Body.Trim(),
            IsInternal = isInternal,
            CreatedAtUtc = DateTime.UtcNow
        };

        _db.SubmissionMessages.Add(msg);

        _db.AuditLogs.Add(new AuditLog
        {
            Id = Guid.NewGuid(),
            CreatedAtUtc = DateTime.UtcNow,
            UserEmail = senderEmail,
            Action = isInternal ? "CHAT_INTERNAL_NOTE" : "CHAT_MESSAGE_SENT",
            EntityType = "Submission",
            EntityId = submissionId.ToString(),
            Details = $"SenderType={senderType}"
        });

        await _db.SaveChangesAsync();

        if (request.SendEmailToContact && !isInternal && !string.IsNullOrWhiteSpace(submission.Email))
        {
            var subject = string.IsNullOrWhiteSpace(request.Subject)
                ? $"Re: {submission.Type} - {submission.Name}"
                : request.Subject.Trim();

            await _email.SendAsync(submission.Email, subject, request.Body.Trim());
        }

        var payload = new
        {
            msg.Id,
            msg.SubmissionId,
            msg.SenderType,
            msg.SenderEmail,
            msg.Body,
            msg.IsInternal,
            msg.CreatedAtUtc
        };

        await _hub.Clients.Group("staff").SendAsync("message_received", payload);

        var participantIds = await _db.SubmissionParticipants.AsNoTracking()
            .Where(x => x.SubmissionId == submissionId)
            .Select(x => x.UserId)
            .ToListAsync();

        foreach (var id in participantIds)
            await _hub.Clients.Group($"user:{id}").SendAsync("message_received", payload);

        return Ok(payload);
    }
}

public class AddParticipantRequest
{
    public Guid UserId { get; set; }
}

public class SendMessageRequest
{
    public string Body { get; set; } = "";
    public bool IsInternal { get; set; } = false;
    public bool SendEmailToContact { get; set; } = false;
    public string? Subject { get; set; }
}