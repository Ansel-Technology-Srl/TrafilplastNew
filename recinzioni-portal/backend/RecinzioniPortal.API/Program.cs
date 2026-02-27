using System.Text;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;
using RecinzioniPortal.API.Data;
using RecinzioniPortal.API.Services;

var builder = WebApplication.CreateBuilder(args);

// ====== Database ======
builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseSqlServer(builder.Configuration.GetConnectionString("DefaultConnection")));

// ====== JWT Authentication ======
var jwtKey = builder.Configuration["Jwt:Key"] ?? "SuperSecretKeyThatIsAtLeast32Characters!";
builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            ValidIssuer = builder.Configuration["Jwt:Issuer"] ?? "RecinzioniPortal",
            ValidAudience = builder.Configuration["Jwt:Audience"] ?? "RecinzioniPortal",
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey))
        };
    });
builder.Services.AddAuthorization();

// ====== Services ======
builder.Services.AddScoped<AuthService>();
builder.Services.AddScoped<ConfiguratoreService>();
builder.Services.AddScoped<EuritmoService>();
builder.Services.AddScoped<EmailService>();
builder.Services.AddScoped<PdfService>();

// ====== CORS ======
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowFrontend", policy =>
    {
        policy.WithOrigins(
                builder.Configuration["Frontend:Url"] ?? "http://localhost:5173",
                "http://localhost:5173",
                "http://localhost:3000"
            )
            .AllowAnyHeader()
            .AllowAnyMethod()
            .AllowCredentials();
    });
});

// ====== Swagger ======
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new OpenApiInfo { Title = "Recinzioni Portal API", Version = "v1" });
    c.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        In = ParameterLocation.Header,
        Description = "Inserire il token JWT con prefisso 'Bearer '",
        Name = "Authorization",
        Type = SecuritySchemeType.ApiKey,
        Scheme = "Bearer"
    });
    c.AddSecurityRequirement(new OpenApiSecurityRequirement
    {
        {
            new OpenApiSecurityScheme
            {
                Reference = new OpenApiReference { Type = ReferenceType.SecurityScheme, Id = "Bearer" }
            },
            Array.Empty<string>()
        }
    });
});

// Licenza QuestPDF Community (gratuita)
QuestPDF.Settings.License = QuestPDF.Infrastructure.LicenseType.Community;
// Evita eccezioni se un glifo non è disponibile nel font corrente
QuestPDF.Settings.CheckIfAllTextGlyphsAreAvailable = false;

var app = builder.Build();

// ====== Pipeline ======
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseHttpsRedirection();

// Serve il frontend React (build statica)
app.UseDefaultFiles();
app.UseStaticFiles();

app.UseCors("AllowFrontend");
app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

// Fallback per SPA routing (React Router)
app.MapFallbackToFile("index.html");

app.Run();