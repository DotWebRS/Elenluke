using System.IO;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Persistence;
using System.Text;
using Microsoft.AspNetCore.Http.Features;
using API.Security;
using Domain.Entities;
using API.Services;
using Microsoft.OpenApi.Models;
using Microsoft.OpenApi;


var builder = WebApplication.CreateBuilder(args);

builder.Services.AddControllers();

builder.Services.Configure<FormOptions>(o =>
{
    o.MultipartBodyLengthLimit = 20 * 1024 * 1024;
});

builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseSqlServer(builder.Configuration.GetConnectionString("DefaultConnection")));

builder.Services.AddEndpointsApiExplorer();

builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowFrontend", policy =>
    {
        policy.WithOrigins("http://localhost:5173")
              .AllowAnyHeader()
              .AllowAnyMethod();
    });
});

builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.RequireHttpsMetadata = false;
        options.SaveToken = true;
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            ValidIssuer = builder.Configuration["Jwt:Issuer"],
            ValidAudience = builder.Configuration["Jwt:Audience"],
            IssuerSigningKey = new SymmetricSecurityKey(
            Encoding.UTF8.GetBytes(builder.Configuration["Jwt:Key"]!)
        ),
            RoleClaimType = "role",
            NameClaimType = "email"
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



var app = builder.Build();

using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    db.Database.Migrate();

    var seedUser = builder.Configuration["Admin:Username"] ?? "admin";
    var seedPass = builder.Configuration["Admin:Password"] ?? "admin123";

    var admin = db.Users.FirstOrDefault(u => u.Email == seedUser);

    if (admin == null)
    {
        admin = new User
        {
            Id = Guid.NewGuid(),
            Email = seedUser,
            PasswordHash = PasswordHasher.Hash(seedPass),
            Role = "Admin",
            IsActive = true,
            CreatedAt = DateTime.UtcNow
        };
        db.Users.Add(admin);
        db.SaveChanges();
    }
    else
    {

        if (!admin.IsActive)
        {
            admin.IsActive = true;
            db.SaveChanges();
        }
    }
}


Directory.CreateDirectory(Path.Combine(app.Environment.WebRootPath ?? Path.Combine(app.Environment.ContentRootPath, "wwwroot"), "uploads"));
Directory.CreateDirectory(Path.Combine(app.Environment.ContentRootPath, "uploads_private"));

app.UseCors("AllowFrontend");
app.UseAuthentication();
app.UseAuthorization();

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseStaticFiles();

app.UseHttpsRedirection();
app.MapControllers();
app.Run();
