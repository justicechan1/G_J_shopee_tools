import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useStore = create(
  persist(
    (set) => ({
      // ── 인증 ──────────────────────────────────────────────
      token:        null,
      refreshToken: null,
      user:         null,   // { id, email }

      crawlLogs: [],
      appendCrawlLogs: (newLogs) => set((s) => ({ crawlLogs: [...s.crawlLogs, ...newLogs] })),
      clearCrawlLogs:  ()        => set({ crawlLogs: [] }),

      login:  ({ access_token, refresh_token, user }) =>
        set({ token: access_token, refreshToken: refresh_token, user }),
      logout: () =>
        set({ token: null, refreshToken: null, user: null, crawlLogs: [] }),

      // ── 환율 설정 ──────────────────────────────────────────
      vnRate:   17.8,
      sgRate:   1100,
      domShip:  3500,

      // ── 수수료 설정 ────────────────────────────────────────
      vnComm:    13.64,
      vnPg:       4.91,
      vnShipOff: 15000,
      sgComm:    15.35,
      sgPg:       3.00,
      sgSvc:      0.80,
      sgShipOff:  1.83,

      // ── 마진 설정 ──────────────────────────────────────────
      marginMin: 10,
      marginNor: 20,
      marginTgt: 30,

      setRates:   (r) => set(r),
      setFees:    (f) => set(f),
      setMargins: (m) => set(m),

      // ── 판매가 추천 씨드 (페이지 이동 시 자동 주입, 비지속) ──
      recSeed: null,
      setRecSeed:   (seed) => set({ recSeed: seed }),
      clearRecSeed: ()     => set({ recSeed: null }),

      // ── 수익 계산기 씨드 (판가추천 → VN/SG 이동, 비지속) ──
      calcSeed: null,
      setCalcSeed:   (seed) => set({ calcSeed: seed }),
      clearCalcSeed: ()     => set({ calcSeed: null }),
    }),
    {
      name: 'shopee-config',
      partialize: (s) => ({
        token:        s.token,
        refreshToken: s.refreshToken,
        user:         s.user,
        crawlLogs:    s.crawlLogs,
        vnRate:    s.vnRate,   sgRate:    s.sgRate,   domShip:   s.domShip,
        vnComm:    s.vnComm,   vnPg:      s.vnPg,     vnShipOff: s.vnShipOff,
        sgComm:    s.sgComm,   sgPg:      s.sgPg,     sgSvc:     s.sgSvc,   sgShipOff: s.sgShipOff,
        marginMin: s.marginMin, marginNor: s.marginNor, marginTgt: s.marginTgt,
      }),
    }
  )
);
