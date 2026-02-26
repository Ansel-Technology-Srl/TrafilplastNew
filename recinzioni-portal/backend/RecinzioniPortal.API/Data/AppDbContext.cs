using Microsoft.EntityFrameworkCore;
using RecinzioniPortal.API.Models;

namespace RecinzioniPortal.API.Data;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

    public DbSet<Cliente> Clienti => Set<Cliente>();
    public DbSet<PuntoDiVendita> PuntiDiVendita => Set<PuntoDiVendita>();
    public DbSet<Utente> Utenti => Set<Utente>();
    public DbSet<Prodotto> Prodotti => Set<Prodotto>();
    public DbSet<ProdottoTrad> ProdottiTrad => Set<ProdottoTrad>();
    public DbSet<Prezzo> Prezzi => Set<Prezzo>();
    public DbSet<ListinoTestata> ListiniTestata => Set<ListinoTestata>();
    public DbSet<OrdineTestata> OrdiniTestata => Set<OrdineTestata>();
    public DbSet<OrdineDettaglio> OrdiniDettaglio => Set<OrdineDettaglio>();
    public DbSet<OrdineConfig> OrdiniConfig => Set<OrdineConfig>();
    public DbSet<RefreshToken> RefreshTokens => Set<RefreshToken>();
    public DbSet<NotificaConfig> NotificheConfig => Set<NotificaConfig>();
    public DbSet<PasswordResetToken> PasswordResetTokens => Set<PasswordResetToken>();
    public DbSet<LoginAttempt> LoginAttempts => Set<LoginAttempt>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        // Composite keys
        modelBuilder.Entity<PuntoDiVendita>()
            .HasKey(p => new { p.ItemID, p.ItemIDSede });

        modelBuilder.Entity<ProdottoTrad>()
            .HasKey(p => new { p.PrdCod, p.LangCode });

        modelBuilder.Entity<Prezzo>()
            .HasKey(p => new { p.PrdCod, p.LstCod });

        modelBuilder.Entity<ListinoTestata>()
            .HasKey(l => new { l.LstCod, l.ValidoDal, l.ValidoAl });

        modelBuilder.Entity<OrdineDettaglio>()
            .HasKey(d => new { d.OrdNum, d.RigaNum });

        modelBuilder.Entity<OrdineConfig>()
            .HasKey(c => new { c.OrdNum, c.RigaNum });

        // Relationships
        modelBuilder.Entity<PuntoDiVendita>()
            .HasOne(p => p.Cliente)
            .WithMany(c => c.PuntiVendita)
            .HasForeignKey(p => p.ItemID);

        modelBuilder.Entity<ProdottoTrad>()
            .HasOne(t => t.Prodotto)
            .WithMany(p => p.Traduzioni)
            .HasForeignKey(t => t.PrdCod);

        modelBuilder.Entity<OrdineDettaglio>()
            .HasOne(d => d.Testata)
            .WithMany(t => t.Righe)
            .HasForeignKey(d => d.OrdNum);

        modelBuilder.Entity<OrdineConfig>()
            .HasOne<OrdineDettaglio>()
            .WithOne()
            .HasForeignKey<OrdineConfig>(c => new { c.OrdNum, c.RigaNum })
            .OnDelete(DeleteBehavior.Cascade);
    }
}
