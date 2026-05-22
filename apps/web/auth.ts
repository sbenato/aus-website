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

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [WCAProvider],
  callbacks: {
    async jwt({ token, account, profile }) {
      // On first sign-in `account` and `profile` are populated
      if (account?.access_token) {
        token.accessToken = account.access_token;
        const p = profile as AnyProfile | undefined;
        token.wcaId = p?.wca_id ?? null;
        token.countryIso2 = p?.country_iso2 ?? "UY";
        token.delegateStatus = p?.delegate_status ?? null;
        token.wcaInternalId = p?.id;
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
