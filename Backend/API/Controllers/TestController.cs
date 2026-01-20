using Microsoft.AspNetCore.Mvc;
using Persistence;

namespace API.Controllers;

[ApiController]
[Route("api/test")]
public class TestController : ControllerBase
{
    private readonly AppDbContext _db;

    public TestController(AppDbContext db)
    {
        _db = db;
    }

    [HttpGet("db")]
    public IActionResult CheckDb()
    {
        return Ok(new
        {
            Users = _db.Users.Count(),
            Submissions = _db.Submissions.Count()
        });
    }
}
