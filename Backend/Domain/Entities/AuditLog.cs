using System;

namespace Domain.Entities
{
    public class AuditLog
    {
        public Guid Id { get; set; }

        public string Action { get; set; } = "";

        public DateTime CreatedAtUtc { get; set; } = DateTime.UtcNow;

        public string Details { get; set; } = "";

        public string EntityId { get; set; } = "";

        public string EntityType { get; set; } = "";

        public string UserEmail { get; set; } = "";
    }
}
