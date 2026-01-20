using API.Security;
using Domain.Entities;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Persistence;
using System.Security.Claims;

namespace API.Controllers;

[ApiController]
[Route("api/users")]
[Authorize(Roles = "Admin")]
public class UsersController : ControllerBase
{
    private readonly AppDbContext _db;

    public UsersController(AppDbContext db)
    {
        _db = db;
    }

    // -------------------------
    // Helpers
    // -------------------------
    private string? GetCurrentIdentifier()
    {
        // probaj što više varijanti (zavisi šta stavljaš u JWT)
        return User?.Claims?.FirstOrDefault(c =>
                c.Type == ClaimTypes.NameIdentifier ||
                c.Type == ClaimTypes.Name ||
                c.Type == ClaimTypes.Email ||
                c.Type == "sub" ||
                c.Type.Equals("id", StringComparison.OrdinalIgnoreCase) ||
                c.Type.EndsWith("/name", StringComparison.OrdinalIgnoreCase) ||
                c.Type.EndsWith("/emailaddress", StringComparison.OrdinalIgnoreCase)
            )?.Value;
    }

    private bool IsSelf(User user)
    {
        var me = (GetCurrentIdentifier() ?? "").Trim();
        if (string.IsNullOrWhiteSpace(me)) return false;

        // ako u tokenu ima Guid id
        if (Guid.TryParse(me, out var meId))
            return user.Id == meId;

        // email ili "name" (nekad ti je name = "admin")
        if (string.Equals(user.Email, me, StringComparison.OrdinalIgnoreCase))
            return true;

        // fallback: ako ti je name claim "admin" a u bazi email isto "admin"
        if (string.Equals(user.Email?.Trim(), me, StringComparison.OrdinalIgnoreCase))
            return true;

        return false;
    }

    private bool ExistsOtherActiveAdmin(Guid excludeId)
    {
        return _db.Users.Any(x =>
            x.Id != excludeId &&
            x.Role == "Admin" &&
            x.IsActive == true
        );
    }

    private IActionResult BlockIfWouldRemoveLastActiveAdmin(User target, bool isRemovingAdminPrivilegesOrDeactivating)
    {
        if (!isRemovingAdminPrivilegesOrDeactivating) return Ok();

        // samo ako je target trenutno aktivan Admin
        if (target.Role == "Admin" && target.IsActive)
        {
            if (!ExistsOtherActiveAdmin(target.Id))
                return BadRequest("Cannot remove or disable the last active Admin account.");
        }

        return Ok();
    }

    // -------------------------
    // Endpoints
    // -------------------------

    [HttpGet]
    public IActionResult List()
    {
        var users = _db.Users
            .AsNoTracking()
            .OrderByDescending(x => x.CreatedAt)
            .Select(x => new UserDto
            {
                Id = x.Id,
                Email = x.Email,
                Role = x.Role,
                IsActive = x.IsActive,
                CreatedAt = x.CreatedAt
            })
            .ToList();

        return Ok(users);
    }

    [HttpPost]
    public IActionResult Create([FromBody] CreateUserRequest request)
    {
        var email = (request.Email ?? string.Empty).Trim();
        var role = (request.Role ?? string.Empty).Trim();

        if (email.Length == 0 || role.Length == 0 || string.IsNullOrWhiteSpace(request.Password))
            return BadRequest("Email, password and role are required.");

        if (role != "Admin" && role != "Editor" && role != "Inbox")
            return BadRequest("Role must be Admin, Editor, or Inbox.");

        var exists = _db.Users.Any(x => x.Email == email);
        if (exists)
            return Conflict("User already exists.");

        var user = new User
        {
            Id = Guid.NewGuid(),
            Email = email,
            PasswordHash = PasswordHasher.Hash(request.Password),
            Role = role,
            IsActive = request.IsActive ?? true,
            CreatedAt = DateTime.UtcNow
        };

        _db.Users.Add(user);
        _db.SaveChanges();

        return Ok(new UserDto
        {
            Id = user.Id,
            Email = user.Email,
            Role = user.Role,
            IsActive = user.IsActive,
            CreatedAt = user.CreatedAt
        });
    }

    // General update (ne sme da zaobiđe zaštite)
    [HttpPut("{id:guid}")]
    public IActionResult Update([FromRoute] Guid id, [FromBody] UpdateUserRequest request)
    {
        var user = _db.Users.FirstOrDefault(x => x.Id == id);
        if (user == null) return NotFound();

        // Email
        if (!string.IsNullOrWhiteSpace(request.Email))
        {
            var email = request.Email.Trim();
            if (email.Length == 0) return BadRequest("Email cannot be empty.");

            var exists = _db.Users.Any(x => x.Email == email && x.Id != id);
            if (exists) return Conflict("Email already in use.");

            user.Email = email;
        }

        // Role
        if (!string.IsNullOrWhiteSpace(request.Role))
        {
            var nextRole = request.Role.Trim();
            if (nextRole != "Admin" && nextRole != "Editor" && nextRole != "Inbox")
                return BadRequest("Role must be Admin, Editor, or Inbox.");

            // ne dozvoli sebi promenu role
            if (IsSelf(user) && !string.Equals(user.Role, nextRole, StringComparison.OrdinalIgnoreCase))
                return BadRequest("You cannot change your own role.");

            // ako skidaš Admin privilegije -> ne sme ako je poslednji aktivan admin
            var removingAdmin = (user.Role == "Admin" && nextRole != "Admin");
            var guard = BlockIfWouldRemoveLastActiveAdmin(user, removingAdmin);
            if (guard is BadRequestObjectResult) return guard;

            user.Role = nextRole;
        }

        // Active
        if (request.IsActive != null)
        {
            var nextActive = request.IsActive.Value;

            // ne dozvoli sebi disable
            if (!nextActive && IsSelf(user))
                return BadRequest("You cannot disable your own account.");

            // ako deaktiviraš Admin-a -> ne sme ako je poslednji aktivan admin
            var deactivatingAdmin = (user.Role == "Admin" && user.IsActive && nextActive == false);
            var guard = BlockIfWouldRemoveLastActiveAdmin(user, deactivatingAdmin);
            if (guard is BadRequestObjectResult) return guard;

            user.IsActive = nextActive;
        }

        // Password
        if (!string.IsNullOrWhiteSpace(request.Password))
            user.PasswordHash = PasswordHasher.Hash(request.Password);

        _db.SaveChanges();

        return Ok(new UserDto
        {
            Id = user.Id,
            Email = user.Email,
            Role = user.Role,
            IsActive = user.IsActive,
            CreatedAt = user.CreatedAt
        });
    }

    // UI koristi ovo za Role dropdown
    [HttpPut("{id:guid}/role")]
    public IActionResult UpdateRole([FromRoute] Guid id, [FromBody] UpdateRoleRequest request)
    {
        var user = _db.Users.FirstOrDefault(x => x.Id == id);
        if (user == null) return NotFound();

        var nextRole = (request.Role ?? "").Trim();
        if (nextRole != "Admin" && nextRole != "Editor" && nextRole != "Inbox")
            return BadRequest("Role must be Admin, Editor, or Inbox.");

        // ne dozvoli sebi promenu role
        if (IsSelf(user) && !string.Equals(user.Role, nextRole, StringComparison.OrdinalIgnoreCase))
            return BadRequest("You cannot change your own role.");

        var removingAdmin = (user.Role == "Admin" && nextRole != "Admin");
        var guard = BlockIfWouldRemoveLastActiveAdmin(user, removingAdmin);
        if (guard is BadRequestObjectResult) return guard;

        user.Role = nextRole;
        _db.SaveChanges();

        return Ok(new UserDto
        {
            Id = user.Id,
            Email = user.Email,
            Role = user.Role,
            IsActive = user.IsActive,
            CreatedAt = user.CreatedAt
        });
    }

    // UI koristi ovo za Enable/Disable
    [HttpPut("{id:guid}/active")]
    public IActionResult SetActive([FromRoute] Guid id, [FromBody] UpdateActiveRequest request)
    {
        var user = _db.Users.FirstOrDefault(x => x.Id == id);
        if (user == null) return NotFound();

        // ne dozvoli sebi disable
        if (request.IsActive == false && IsSelf(user))
            return BadRequest("You cannot disable your own account.");

        // ne dozvoli da ugasiš poslednjeg aktivnog admina
        var deactivatingAdmin = (user.Role == "Admin" && user.IsActive && request.IsActive == false);
        var guard = BlockIfWouldRemoveLastActiveAdmin(user, deactivatingAdmin);
        if (guard is BadRequestObjectResult) return guard;

        user.IsActive = request.IsActive;
        _db.SaveChanges();

        return Ok(new UserDto
        {
            Id = user.Id,
            Email = user.Email,
            Role = user.Role,
            IsActive = user.IsActive,
            CreatedAt = user.CreatedAt
        });
    }

    // HARD DELETE (potpuno brisanje)
    [HttpDelete("{id:guid}")]
    public IActionResult HardDelete([FromRoute] Guid id)
    {
        var user = _db.Users.FirstOrDefault(x => x.Id == id);
        if (user == null) return NotFound();

        // ne dozvoli da obrišeš samog sebe
        if (IsSelf(user))
            return BadRequest("Cannot delete the currently logged-in user.");

        // ne dozvoli da obrišeš poslednjeg aktivnog admina
        var deletingLastAdmin = (user.Role == "Admin" && user.IsActive);
        var guard = BlockIfWouldRemoveLastActiveAdmin(user, deletingLastAdmin);
        if (guard is BadRequestObjectResult) return guard;

        _db.Users.Remove(user);
        _db.SaveChanges();

        return NoContent();
    }
}

public class UserDto
{
    public Guid Id { get; set; }
    public string Email { get; set; } = "";
    public string Role { get; set; } = "";
    public bool IsActive { get; set; }
    public DateTime CreatedAt { get; set; }
}

public class CreateUserRequest
{
    public string Email { get; set; } = "";
    public string Password { get; set; } = "";
    public string Role { get; set; } = "";
    public bool? IsActive { get; set; }
}

public class UpdateUserRequest
{
    public string? Email { get; set; }
    public string? Password { get; set; }
    public string? Role { get; set; }
    public bool? IsActive { get; set; }
}

public class UpdateRoleRequest
{
    public string Role { get; set; } = "";
}

public class UpdateActiveRequest
{
    public bool IsActive { get; set; }
}
