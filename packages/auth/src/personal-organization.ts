type PersonalOrganizationUser = {
  id: string
  email: string
  name?: string | null
}

function normalizeBaseLabel(value: string) {
  return value
    .trim()
    .replace(/[._+-]+/g, ' ')
    .replace(/\s+/g, ' ')
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-{2,}/g, '-')
}

export function buildPersonalOrganization(user: PersonalOrganizationUser) {
  const emailLocalPart = user.email.split('@')[0] ?? 'user'
  const baseLabel = normalizeBaseLabel(user.name || emailLocalPart) || 'User'
  const slugBase = slugify(baseLabel) || 'user'
  const stableSuffix =
    user.id
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '')
      .slice(0, 8) || 'personal'

  return {
    name: `${baseLabel}'s Workspace`,
    slug: `${slugBase}-${stableSuffix}`,
  }
}
