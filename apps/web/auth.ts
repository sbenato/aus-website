import NextAuth from "next-auth";
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyProfile = Record<string, any>;

const WCAProvider = {
  id: "wca",
  name: "World Cube Association",
  type: "oauth" as const,
  clientId: process.env.AUTH_WCA_ID,
  clientSecret: process.env.AUTH_WCA_SECRET,
  authorization: {
    url: "https://www.worldcubeassociation.org/oauth/authorize",
    params: { scope: "public email", response_type: "code" },
  },
  token: "https://www.worldcubeassociation.org/oauth/token",
  userinfo: {
    url: "https://www.worldcubeassociation.org/api/v0/me",
    async request({
      tokens,
    }: {
      tokens: { access_token?: string };
    }): Promise<AnyProfile> {
      const res = await fetch(
        "https://www.worldcubeassociation.org/api/v0/me",
        { headers: { Authorization: `Bearer ${tokens.access_token}` } }
      );
      const json = await res.json();
      // WCA wraps the user under { me: { ... } }
      return json.me ?? json;
    },
  },
  profile(profile: AnyProfile) {
    return {
      id: String(profile.id),
      name: profile.name ?? null,
      email: profile.email ?? null,
      image: profile.avatar?.thumb_url ?? null,
    };
  },
};

/** Cada cuánto se vuelve a preguntarle a la WCA por el rol de la persona. */
const PERMS_TTL_MS = 15 * 60 * 1000;

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [WCAProvider],
  session: {
    // Con 30 días (el default) alguien dado de baja como delegado seguía
    // pudiendo mover plata durante un mes.
    maxAge: 12 * 60 * 60,
  },
  callbacks: {
    async jwt({ token, account, profile }) {
      // On first sign-in `account` and `profile` are populated
      if (account?.access_token) {
        token.accessToken = account.access_token;
        const p = profile as AnyProfile | undefined;
        token.wcaId = p?.wca_id ?? null;
        // Nunca asumir el país: el default de un campo que concede permiso no
        // puede ser el valor que lo concede.
        token.countryIso2 = p?.country_iso2 ?? null;
        token.delegateStatus = p?.delegate_status ?? null;
        token.wcaInternalId = p?.id;
        token.permsCheckedAt = Date.now();
        return token;
      }

      // Re-consultar el perfil cada tanto: si a alguien lo dan de baja como
      // delegado, deja de poder editar sin esperar a que expire la sesión.
      const checked = typeof token.permsCheckedAt === "number" ? token.permsCheckedAt : 0;
      if (token.accessToken && Date.now() - checked > PERMS_TTL_MS) {
        token.permsCheckedAt = Date.now();
        try {
          const res = await fetch(
            "https://www.worldcubeassociation.org/api/v0/me",
            {
              headers: { Authorization: `Bearer ${token.accessToken}` },
              signal: AbortSignal.timeout(8000),
            }
          );
          if (res.ok) {
            const json = await res.json();
            const me: AnyProfile = json.me ?? json;
            token.wcaId = me.wca_id ?? null;
            token.countryIso2 = me.country_iso2 ?? null;
            token.delegateStatus = me.delegate_status ?? null;
          } else if (res.status === 401) {
            // Token revocado del lado de la WCA: se cae el permiso, no la sesión.
            token.delegateStatus = null;
          }
        } catch {
          // La WCA no contesta: se conserva lo que había hasta el próximo intento.
        }
      }
      return token;
    },
    async session({ session, token }) {
      session.accessToken = token.accessToken;
      session.user.wcaId = token.wcaId;
      session.user.countryIso2 = token.countryIso2;
      session.user.delegateStatus = token.delegateStatus;
      session.user.wcaInternalId = token.wcaInternalId;
      return session;
    },
  },
  pages: {
    signIn: "/login",
    error: "/login",
  },
});
