using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using SpTrack.Domain.Entities;

namespace SpTrack.Infrastructure.Data.Configurations;

public class TicketConfiguration : IEntityTypeConfiguration<Ticket>
{
   public void Configure(EntityTypeBuilder<Ticket> builder)
   {
       builder.HasKey(e => e.Id);
       
       builder.HasIndex(e => e.Key).IsUnique();
       builder.HasIndex(e => e.Status);
       builder.HasIndex(e => e.Priority);
       builder.HasIndex(e => e.AssigneeId);
       builder.HasIndex(e => e.ReporterId);
       builder.HasIndex(e => e.CreatedAt);

       builder.Property(e => e.Key).IsRequired().HasMaxLength(20);
       builder.Property(e => e.Title).IsRequired().HasMaxLength(200);
       builder.Property(e => e.Description).IsRequired();


       builder.HasOne(e => e.Project)
           .WithMany(e => e.Tickets)
           .HasForeignKey(e => e.ProjectId)
           .OnDelete(DeleteBehavior.Cascade);

       builder.HasOne(e => e.Reporter)
           .WithMany(e => e.ReportedTickets)
           .HasForeignKey(e => e.ReporterId)
           .OnDelete(DeleteBehavior.Restrict);

       builder.HasOne(e => e.Assignee)
           .WithMany(e => e.AssignedTickets)
           .HasForeignKey(e => e.AssigneeId)
           .OnDelete(DeleteBehavior.SetNull);

       builder.HasOne(e => e.Category)
           .WithMany(e => e.Tickets)
           .HasForeignKey(e => e.CategoryId)
           .OnDelete(DeleteBehavior.SetNull);

       builder.HasOne(e => e.Product)
           .WithMany(e => e.Tickets)
           .HasForeignKey(e => e.ProductId)
           .OnDelete(DeleteBehavior.SetNull);

       // Configure enum conversions
       builder.Property(e => e.Priority).HasConversion<string>();
       builder.Property(e => e.Status).HasConversion<string>();
       builder.Property(e => e.Severity).HasConversion<string>();
       builder.Property(e => e.Source).HasConversion<string>();
   }
}