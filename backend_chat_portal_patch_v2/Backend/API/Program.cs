using System.Text;
using System.Security.Claims;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Http.Features;
using Microsoft.AspNetCore.HttpOverrides;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;
using Microsoft.OpenApi;
using Persistence;
using API.Security;
using Domain.Entities;
using API.Services;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddControllers();
builder.Services.AddSignalR();

var appDataDir = Path.Combine(builder.Environment.ContentRootPath, "App_Data");
Directory.CreateDirectory(appDataDir);

var tempRoot = Path.Combine(appDataDir, "Temp");
Directory.CreateDirectory(tempRoot);
Environment.SetEnvironmentVariable("ASPNETCORE_TEMP", tempRoot);

builder.Services.Configure<FormOptions>(o =>
{
    o.MultipartBodyLengthLimit = 20 * 1024 * 1024;
    o.MemoryBufferThreshold = 20 * 1024 * 1024;
});

var dbPath = Path.Combine(appDataDir, "PurpleMedia.db");
builder.Services.AddDbContext<AppDbContext>(o =>
    o.UseSqlite($"Data Source={dbPath}"));

builder.Services.AddEndpointsApiExplorer();

var allowedOrigins = builder.Configuration
    .GetSection("Cors:AllowedOrigins")
    .Get<string[]>();

if (allowedOrigins == null || allowedOrigins.Length == 0)
{
    if (builder.Environment.IsDevelopment())
    {
        allowedOrigins = new[]
        {
            "http://localhost:3000",
            "http://localhost:5173",
            "http://127.0.0.1:3000",
            "http://127.0.0.1:5173"
        };
    }
    else
    {
        throw new Exception("Missing Cors:AllowedOrigins configuration.");
    }
}

builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowFrontend", policy =>
    {
        policy
            .WithOrigins(allowedOrigins)
            .AllowAnyHeader()
            .AllowAnyMethod()
            .AllowCredentials();
    });
});

var jwtKey = builder.Configuration["Jwt:Key"];
var jwtIssuer = builder.Configuration["Jwt:Issuer"];
var jwtAudience = builder.Configuration["Jwt:Audience"];

if (string.IsNullOrWhiteSpace(jwtKey) || jwtKey.Length < 32)
    throw new Exception("Missing/weak Jwt:Key (min 32 chars) in configuration.");

if (string.IsNullOrWhiteSpace(jwtIssuer))
    throw new Exception("Missing Jwt:Issuer in configuration.");

if (string.IsNullOrWhiteSpace(jwtAudience))
    throw new Exception("Missing Jwt:Audience in configuration.");

builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.RequireHttpsMetadata = !builder.Environment.IsDevelopment();
        options.SaveToken = true;
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            ValidIssuer = jwtIssuer,
            ValidAudience = jwtAudience,
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey)),
            RoleClaimType = ClaimTypes.Role,
            NameClaimType = ClaimTypes.Name
        };
        options.Events = new JwtBearerEvents
        {
            OnMessageReceived = context =>
            {
                var accessToken = context.Request.Query["access_token"];
                var path = context.HttpContext.Request.Path;
                if (!string.IsNullOrEmpty(accessToken) && path.StartsWithSegments("/hubs/notifications"))
                    context.Token = accessToken;
                return Task.CompletedTask;
            }
        };
    });

builder.Services.AddAuthorization();
builder.Services.AddScoped<IEmailSender, EmailSender>();

builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new OpenApiInfo { Title = "API", Version = "v1" });

    c.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        Description = "Unesi samo token (bez 'Bearer ')",
        Name = "Authorization",
        In = ParameterLocation.Header,
        Type = SecuritySchemeType.Http,
        Scheme = "bearer",
        BearerFormat = "JWT"
    });

    c.AddSecurityRequirement(new OpenApiSecurityRequirement
    {
        {
            new OpenApiSecurityScheme
            {
                Reference = new OpenApiReference
                {
                    Type = ReferenceType.SecurityScheme,
                    Id = "Bearer"
                }
            },
            Array.Empty<string>()
        }
    });
});

builder.Services.Configure<ForwardedHeadersOptions>(options =>
{
    options.ForwardedHeaders = ForwardedHeaders.XForwardedFor | ForwardedHeaders.XForwardedProto;
    options.KnownNetworks.Clear();
    options.KnownProxies.Clear();
});

var app = builder.Build();

app.UseForwardedHeaders();

if (!app.Environment.IsDevelopment())
{
    app.UseHsts();
}

app.UseHttpsRedirection();
app.UseStaticFiles();
app.UseRouting();
app.UseCors("AllowFrontend");
app.UseAuthentication();
app.UseAuthorization();

Directory.CreateDirectory(Path.Combine(app.Environment.WebRootPath ?? app.Environment.ContentRootPath, "uploads"));
Directory.CreateDirectory(Path.Combine(app.Environment.ContentRootPath, "uploads_private"));
Directory.CreateDirectory(Path.Combine(app.Environment.ContentRootPath, "App_Data", "Temp"));

using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    db.Database.Migrate();

    db.Database.ExecuteSqlRaw(@"CREATE TABLE IF NOT EXISTS SubmissionMessages (
        Id TEXT NOT NULL PRIMARY KEY,
        SubmissionId TEXT NOT NULL,
        SenderType TEXT NOT NULL,
        SenderEmail TEXT NOT NULL,
        Body TEXT NOT NULL,
        IsInternal INTEGER NOT NULL DEFAULT 0,
        CreatedAtUtc TEXT NOT NULL,
        FOREIGN KEY (SubmissionId) REFERENCES Submissions (Id) ON DELETE CASCADE
    );");

    db.Database.ExecuteSqlRaw(@"CREATE TABLE IF NOT EXISTS SubmissionParticipants (
        Id TEXT NOT NULL PRIMARY KEY,
        SubmissionId TEXT NOT NULL,
        UserId TEXT NOT NULL,
        AddedAtUtc TEXT NOT NULL,
        AddedByEmail TEXT NULL,
        FOREIGN KEY (SubmissionId) REFERENCES Submissions (Id) ON DELETE CASCADE,
        FOREIGN KEY (UserId) REFERENCES Users (Id) ON DELETE CASCADE
    );");

    var seedUser = builder.Configuration["Admin:Username"];
    var seedPass = builder.Configuration["Admin:Password"];

    if (string.IsNullOrWhiteSpace(seedUser))
        throw new Exception("Missing Admin:Username configuration.");

    if (string.IsNullOrWhiteSpace(seedPass))
        throw new Exception("Missing Admin:Password configuration.");

    if (!builder.Environment.IsDevelopment() && seedPass == "admin123")
        throw new Exception("Default admin password is not allowed outside Development.");

    var admin = db.Users.FirstOrDefault(u => u.Email == seedUser);
    if (admin == null)
    {
        admin = new User
        {
            Id = Guid.NewGuid(),
            CreatedAt = DateTime.UtcNow,
            Email = seedUser,
            Role = "Admin",
            IsActive = true,
            PasswordHash = PasswordHasher.Hash(seedPass)
        };

        db.Users.Add(admin);
        db.SaveChanges();
    }
    else if (!admin.IsActive)
    {
        admin.IsActive = true;
        db.SaveChanges();
    }
}

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.MapControllers();
app.MapHub<API.Hubs.NotificationsHub>("/hubs/notifications");

app.Run();