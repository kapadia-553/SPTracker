using System.ComponentModel.DataAnnotations;

namespace SpTrack.Api.Models;

// ===== TENANT/ORGANIZATION MODELS =====

public class CreateTenantRequest
{
    [Required]
    [StringLength(100)]
    public string Name { get; set; } = string.Empty;

    [Required]
    [StringLength(50)]
    [RegularExpression(@"^[a-z0-9-]+$", ErrorMessage = "Slug can only contain lowercase letters, numbers, and hyphens")]
    public string Slug { get; set; } = string.Empty;

    [StringLength(50)]
    public string? Timezone { get; set; }

    public string? BusinessHoursJson { get; set; }

    public string? LogoUrl { get; set; }
}

public class UpdateTenantRequest
{
    [Required]
    [StringLength(100)]
    public string Name { get; set; } = string.Empty;

    [Required]
    [StringLength(50)]
    [RegularExpression(@"^[a-z0-9-]+$", ErrorMessage = "Slug can only contain lowercase letters, numbers, and hyphens")]
    public string Slug { get; set; } = string.Empty;

    [StringLength(50)]
    public string? Timezone { get; set; }

    public string? BusinessHoursJson { get; set; }

    public string? LogoUrl { get; set; }

    public bool Active { get; set; } = true;
}

// ===== USER MODELS =====

public class CreateUserRequest
{
    [Required]
    [StringLength(100)]
    public string Name { get; set; } = string.Empty;

    [Required]
    [EmailAddress]
    [StringLength(256)]
    public string Email { get; set; } = string.Empty;

    [Required]
    [StringLength(100, MinimumLength = 8)]
    public string Password { get; set; } = string.Empty;

    public bool IsInternal { get; set; } = false;

    public List<UserRoleRequest>? Roles { get; set; }
}

public class UpdateUserRequest
{
    [Required]
    [StringLength(100)]
    public string Name { get; set; } = string.Empty;

    [Required]
    [EmailAddress]
    [StringLength(256)]
    public string Email { get; set; } = string.Empty;

    public bool IsInternal { get; set; } = false;

    public bool Active { get; set; } = true;

    public List<UserRoleRequest>? Roles { get; set; }
}

public class UserRoleRequest
{
    public Guid? TenantId { get; set; }

    [Required]
    [StringLength(50)]
    public string Role { get; set; } = string.Empty;
}

// ===== PROJECT MODELS =====

public class AdminCreateProjectRequest
{
    [Required]
    [StringLength(10)]
    [RegularExpression(@"^[A-Z0-9]+$", ErrorMessage = "Project key can only contain uppercase letters and numbers")]
    public string Key { get; set; } = string.Empty;

    [Required]
    [StringLength(100)]
    public string Name { get; set; } = string.Empty;

    [StringLength(500)]
    public string? Description { get; set; }
}

public class AdminUpdateProjectRequest
{
    [Required]
    [StringLength(10)]
    [RegularExpression(@"^[A-Z0-9]+$", ErrorMessage = "Project key can only contain uppercase letters and numbers")]
    public string Key { get; set; } = string.Empty;

    [Required]
    [StringLength(100)]
    public string Name { get; set; } = string.Empty;

    [StringLength(500)]
    public string? Description { get; set; }

    public bool Active { get; set; } = true;
}

// ===== CATEGORY MODELS =====

public class AdminCreateCategoryRequest
{
    [Required]
    public Guid TenantId { get; set; }

    [Required]
    [StringLength(100)]
    public string Name { get; set; } = string.Empty;

    public Guid? ParentId { get; set; }
}

public class AdminUpdateCategoryRequest
{
    [Required]
    [StringLength(100)]
    public string Name { get; set; } = string.Empty;

    public Guid? ParentId { get; set; }
}

// ===== PRODUCT MODELS =====

public class AdminCreateProductRequest
{
    [Required]
    public Guid TenantId { get; set; }

    [Required]
    [StringLength(20)]
    [RegularExpression(@"^[A-Z0-9-_]+$", ErrorMessage = "Product code can only contain uppercase letters, numbers, hyphens, and underscores")]
    public string Code { get; set; } = string.Empty;

    [Required]
    [StringLength(100)]
    public string Name { get; set; } = string.Empty;
}

public class AdminUpdateProductRequest
{
    [Required]
    [StringLength(20)]
    [RegularExpression(@"^[A-Z0-9-_]+$", ErrorMessage = "Product code can only contain uppercase letters, numbers, hyphens, and underscores")]
    public string Code { get; set; } = string.Empty;

    [Required]
    [StringLength(100)]
    public string Name { get; set; } = string.Empty;
}