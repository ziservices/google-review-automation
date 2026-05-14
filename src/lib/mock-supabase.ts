// Mock data store
const mockBusinesses = [
  {
    id: "1",
    name: "Demo Cafe",
    custom_url_slug: "demo-cafe",
    place_id: "ChIJN1t_tDeuEmsRUsoyG83frY4",
    email: "info@democafe.com",
    phone: "+1-555-0123",
    description: "A cozy demo cafe for testing",
    is_active: true,
    plan: "basic",
    owner_email: null as string | null,
  },
];

export const mockSupabase = {
  from: (tableName: string) => ({
    select: (columns: string) => ({
      eq: (column: string, value: string) => ({
        single: async () => {
          if (tableName === "businesses") {
            const business = mockBusinesses.find(
              (b) => b[column as keyof typeof mockBusinesses[0]] === value
            );
            return {
              data: business || null,
              error: business ? null : undefined,
            };
          }
          return { data: null, error: new Error("Table not found") };
        },
      }),
    }),
  }),
};
