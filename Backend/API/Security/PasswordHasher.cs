using System.Security.Cryptography;

namespace API.Security;

public static class PasswordHasher
{
    private const int SaltSize = 16;
    private const int KeySize = 32;
    private const int Iterations = 100000;

    public static string Hash(string password)
    {
        var salt = RandomNumberGenerator.GetBytes(SaltSize);
        var key = Rfc2898DeriveBytes.Pbkdf2(
            password,
            salt,
            Iterations,
            HashAlgorithmName.SHA256,
            KeySize
        );

        return string.Join(
            '$',
            "PBKDF2",
            Iterations.ToString(),
            Convert.ToBase64String(salt),
            Convert.ToBase64String(key)
        );
    }

    public static bool Verify(string password, string stored)
    {
        if (string.IsNullOrWhiteSpace(stored))
            return false;

        var parts = stored.Split('$');
        if (parts.Length != 4 && parts.Length != 5)
            return false;

        var offset = parts.Length == 5 ? 1 : 0;
        var alg = parts[offset + 0];
        if (!string.Equals(alg, "PBKDF2", StringComparison.OrdinalIgnoreCase))
            return false;

        if (!int.TryParse(parts[offset + 1], out var iterations))
            return false;

        byte[] salt;
        byte[] expected;

        try
        {
            salt = Convert.FromBase64String(parts[offset + 2]);
            expected = Convert.FromBase64String(parts[offset + 3]);
        }
        catch
        {
            return false;
        }

        var actual = Rfc2898DeriveBytes.Pbkdf2(
            password,
            salt,
            iterations,
            HashAlgorithmName.SHA256,
            expected.Length
        );

        return CryptographicOperations.FixedTimeEquals(actual, expected);
    }
}
