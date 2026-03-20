using System.Text.Json;
using BookstoreApi.Data;
using Microsoft.EntityFrameworkCore;

var builder = WebApplication.CreateBuilder(args);

// Learn more about configuring OpenAPI at https://aka.ms/aspnet/openapi
builder.Services.AddOpenApi();

// Allow the React dev server to call this API.
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowFrontend", policy =>
    {
        policy
            .AllowAnyOrigin()
            .AllowAnyHeader()
            .AllowAnyMethod();
    });
});

// Default to camelCase JSON so the React TS models are easier to write.
builder.Services.ConfigureHttpJsonOptions(options =>
{
    options.SerializerOptions.PropertyNamingPolicy = JsonNamingPolicy.CamelCase;
});

// Locate the pre-populated SQLite file (we copy it into the build output).
var dbPath = Path.GetFullPath(Path.Combine(AppContext.BaseDirectory, "Bookstore.sqlite"));
if (!File.Exists(dbPath))
{
    // Fallback for IDE runs where the file might not have been copied yet.
    dbPath = Path.GetFullPath(Path.Combine(builder.Environment.ContentRootPath, "..", "Bookstore.sqlite"));
}

var connectionString = $"Data Source={dbPath}";

builder.Services.AddDbContext<BookstoreDbContext>(options =>
    options.UseSqlite(connectionString));

var app = builder.Build();

app.UseCors("AllowFrontend");

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}

app.MapGet("/api/books", async (
    BookstoreDbContext db,
    int pageNumber = 1,
    int pageSize = 5,
    string sortDirection = "asc") =>
{
    pageNumber = pageNumber < 1 ? 1 : pageNumber;
    pageSize = pageSize < 1 ? 5 : pageSize;
    pageSize = pageSize > 50 ? 50 : pageSize;

    var descending = string.Equals(sortDirection, "desc", StringComparison.OrdinalIgnoreCase);

    var baseQuery = db.Books.AsNoTracking();
    var totalCount = await baseQuery.CountAsync();
    var totalPages = (int)Math.Ceiling(totalCount / (double)pageSize);

    var orderedQuery = descending
        ? baseQuery.OrderByDescending(b => b.Title)
        : baseQuery.OrderBy(b => b.Title);

    var skip = (pageNumber - 1) * pageSize;

    var items = await orderedQuery
        .Skip(skip)
        .Take(pageSize)
        .Select(b => new
        {
            bookId = b.BookId,
            title = b.Title,
            author = b.Author,
            publisher = b.Publisher,
            isbn = b.ISBN,
            classification = b.Classification,
            category = b.Category,
            pageCount = b.PageCount,
            price = b.Price
        })
        .ToListAsync();

    return Results.Ok(new
    {
        items,
        totalCount,
        pageSize,
        pageNumber,
        totalPages
    });
});

app.Run();
