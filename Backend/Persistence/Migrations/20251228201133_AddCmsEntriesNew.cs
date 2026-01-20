using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddCmsEntriesNew : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "ContentEntries");

            migrationBuilder.DropColumn(
                name: "ContentKey",
                table: "CmsEntries");

            migrationBuilder.DropColumn(
                name: "Locale",
                table: "CmsEntries");

            migrationBuilder.RenameColumn(
                name: "UpdatedAt",
                table: "CmsEntries",
                newName: "UpdatedAtUtc");

            migrationBuilder.AlterColumn<string>(
                name: "SiteKey",
                table: "CmsEntries",
                type: "nvarchar(450)",
                nullable: false,
                oldClrType: typeof(string),
                oldType: "nvarchar(max)");

            migrationBuilder.AddColumn<string>(
                name: "Key",
                table: "CmsEntries",
                type: "nvarchar(450)",
                nullable: false,
                defaultValue: "");

            migrationBuilder.CreateIndex(
                name: "IX_CmsEntries_SiteKey_Key",
                table: "CmsEntries",
                columns: new[] { "SiteKey", "Key" },
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_CmsEntries_SiteKey_Key",
                table: "CmsEntries");

            migrationBuilder.DropColumn(
                name: "Key",
                table: "CmsEntries");

            migrationBuilder.RenameColumn(
                name: "UpdatedAtUtc",
                table: "CmsEntries",
                newName: "UpdatedAt");

            migrationBuilder.AlterColumn<string>(
                name: "SiteKey",
                table: "CmsEntries",
                type: "nvarchar(max)",
                nullable: false,
                oldClrType: typeof(string),
                oldType: "nvarchar(450)");

            migrationBuilder.AddColumn<string>(
                name: "ContentKey",
                table: "CmsEntries",
                type: "nvarchar(max)",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "Locale",
                table: "CmsEntries",
                type: "nvarchar(max)",
                nullable: false,
                defaultValue: "");

            migrationBuilder.CreateTable(
                name: "ContentEntries",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Json = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Key = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: false),
                    Locale = table.Column<string>(type: "nvarchar(10)", maxLength: 10, nullable: false),
                    Published = table.Column<bool>(type: "bit", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ContentEntries", x => x.Id);
                });

            migrationBuilder.CreateIndex(
                name: "IX_ContentEntries_Key_Locale",
                table: "ContentEntries",
                columns: new[] { "Key", "Locale" },
                unique: true);
        }
    }
}
