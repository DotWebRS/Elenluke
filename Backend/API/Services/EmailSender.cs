using System.Net;
using System.Net.Mail;

namespace API.Services;

public interface IEmailSender
{
    Task SendAsync(string to, string subject, string body);
}

public class EmailSender : IEmailSender
{
    private readonly IConfiguration _config;

    public EmailSender(IConfiguration config)
    {
        _config = config;
    }

    public async Task SendAsync(string to, string subject, string body)
    {
        var host = _config["Smtp:Host"] ?? "";
        var portStr = _config["Smtp:Port"] ?? "587";
        var user = _config["Smtp:User"] ?? "";
        var pass = _config["Smtp:Pass"] ?? "";
        var fromEmail = _config["Smtp:FromEmail"] ?? user;
        var fromName = _config["Smtp:FromName"] ?? "Purple Publishing";
        var useSsl = bool.TryParse(_config["Smtp:UseSsl"], out var ssl) ? ssl : true;

        if (string.IsNullOrWhiteSpace(host) || string.IsNullOrWhiteSpace(user) || string.IsNullOrWhiteSpace(pass))
            throw new InvalidOperationException("SMTP config is missing.");

        if (!int.TryParse(portStr, out var port))
            port = 587;

        using var client = new SmtpClient(host, port)
        {
            EnableSsl = useSsl,
            Credentials = new NetworkCredential(user, pass)
        };

        using var message = new MailMessage
        {
            From = new MailAddress(fromEmail, fromName),
            Subject = subject,
            Body = body,
            IsBodyHtml = false
        };

        message.To.Add(to);

        await client.SendMailAsync(message);
    }
}
