// Convert DB records into the exact JSON shapes the React frontend (src/types) expects.

export const toPublicUser = (u) => ({
  id: u.userId,
  name: u.name,
  email: u.email,
  phone: u.phone || '',
  role: u.role,
  availability: u.availability,
  avatarUrl: u.avatarUrl,
  createdAt: u.createdAt,
});

export const toApiOrder = (o) => ({
  ...o,
  deliveryPartnerId: o.deliveryPartnerId ?? null,
  deliveryPartnerName: o.deliveryPartnerName ?? null,
  deliveryPartnerPhone: o.deliveryPartnerPhone ?? null,
});

export const toApiLog = (l) => {
  const { logId, ...rest } = l;
  return { ...rest, id: l.id || logId };
};
