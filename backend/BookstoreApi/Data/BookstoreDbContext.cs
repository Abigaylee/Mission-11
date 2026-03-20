using BookstoreApi.Models;
using Microsoft.EntityFrameworkCore;

namespace BookstoreApi.Data;

public class BookstoreDbContext : DbContext
{
    public BookstoreDbContext(DbContextOptions<BookstoreDbContext> options)
        : base(options)
    {
    }

    public DbSet<Book> Books => Set<Book>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        // Map to the pre-populated SQLite table (already exists in Bookstore.sqlite).
        modelBuilder.Entity<Book>(entity =>
        {
            entity.ToTable("Books");

            entity.HasKey(e => e.BookId);

            entity.Property(e => e.BookId)
                .HasColumnName("BookID")
                .ValueGeneratedOnAdd();

            entity.Property(e => e.Title).HasColumnName("Title").IsRequired();
            entity.Property(e => e.Author).HasColumnName("Author").IsRequired();
            entity.Property(e => e.Publisher).HasColumnName("Publisher").IsRequired();
            entity.Property(e => e.ISBN).HasColumnName("ISBN").IsRequired();
            entity.Property(e => e.Classification).HasColumnName("Classification").IsRequired();
            entity.Property(e => e.Category).HasColumnName("Category").IsRequired();

            entity.Property(e => e.PageCount).HasColumnName("PageCount").IsRequired();
            entity.Property(e => e.Price).HasColumnName("Price").IsRequired().HasColumnType("REAL");
        });
    }
}

