using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddSubmissionArchiveFields : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<DateTime>(
                name: "ArchivedAtUtc",
                table: "Submissions",
                type: "TEXT",
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "IsArchived",
                table: "Submissions",
                type: "INTEGER",
                nullable: false,
                defaultValue: false);

            migrationBuilder.CreateIndex(
                name: "IX_Submissions_Domain_IsArchived_CreatedAt",
                table: "Submissions",
                columns: new[] { "Domain", "IsArchived", "CreatedAt" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_Submissions_Domain_IsArchived_CreatedAt",
                table: "Submissions");

            migrationBuilder.DropColumn(
                name: "ArchivedAtUtc",
                table: "Submissions");

            migrationBuilder.DropColumn(
                name: "IsArchived",
                table: "Submissions");
        }
    }
}
