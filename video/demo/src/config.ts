/**
 * Edit this file to adjust trims, team info and the end-card link.
 * All times are in seconds of the source clip in ../phase N.mp4.
 */
export const CLIPS = {
  p1: { src: "footage/phase1.mp4", from: 6.9, to: 27.6 },
  p2: { src: "footage/phase2.mp4", from: 0, to: 24.4 },
  p3: { src: "footage/phase3.mp4", from: 2.55, to: 23.4 },
  p4: { src: "footage/phase4.mp4", from: 0, to: 32.8 },
  p5: { src: "footage/phase5.mp4", from: 0, to: 11.6 },
} as const;

export const TITLE_CARD_SECONDS = 2.8;
export const TRANSITION_SECONDS = 0.4;

export const TEAM_NAME = "sewunode";

/** Optional member cards for Phase 3. Leave empty to show only the team name. */
export const TEAM_MEMBERS: { name: string; role: string; flag: string }[] = [];

/** Shown on the end card when set, e.g. "github.com/<org>/tekosue". */
export const REPO_URL = "";

export type Cue = { from: number; to: number; text: string };

/**
 * Burned-in captions, cleaned up from the recorded audio.
 * NFR-07: "seed phrase" / "gas token" stay narration-only, so the Phase 4 cue paraphrases them out.
 */
export const CAPTIONS: Record<keyof typeof CLIPS, Cue[]> = {
  p1: [
    { from: 7.46, to: 9.7, text: "Wait, who paid for the hotel earlier?" },
    { from: 10.4, to: 13.3, text: "I covered it. And last night's dinner was you, right?" },
    { from: 13.6, to: 15.0, text: "No, it wasn't me." },
    { from: 16.4, to: 19.6, text: "Then who do I pay — you, or you?" },
    { from: 20.6, to: 22.9, text: "And what's the exchange rate?" },
    { from: 23.4, to: 24.65, text: "The group chat is already buried, see?" },
    { from: 24.7, to: 27.4, text: "I can't even keep track of this group anymore." },
  ],
  p2: [
    { from: 0.0, to: 4.6, text: "That's what splitting costs across countries feels like." },
    { from: 5.44, to: 10.0, text: "Tekosue is a pot for friends and family in different countries." },
    { from: 10.9, to: 16.5, text: "Everyone puts digital dollars — AUSD — into one pot, and spends from it." },
    { from: 16.7, to: 20.3, text: "When the trip ends, the pot settles up by itself." },
    { from: 21.0, to: 24.0, text: "And Tekosue works on Monad testnet." },
  ],
  p3: [
    { from: 2.65, to: 4.9, text: `We are the ${TEAM_NAME} team,` },
    { from: 5.0, to: 13.9, text: "and we travel a lot — often on open trips with people from all kinds of backgrounds." },
    { from: 14.0, to: 21.2, text: "And splitting costs fairly is the main problem we run into every time." },
  ],
  p4: [
    { from: 0.0, to: 2.9, text: "We built Tekosue around four goals." },
    { from: 3.2, to: 11.9, text: "One: from an invite link to trip member in a single flow — just a passkey." },
    { from: 12.08, to: 16.3, text: "Two: let any member spend from the pot while it has money." },
    { from: 16.8, to: 20.4, text: "The only thing they record is who the payment was for." },
    { from: 20.9, to: 25.7, text: "Three: move every dollar in AUSD, final within seconds." },
    { from: 25.9, to: 29.3, text: "And four: settle up automatically on the end date," },
    { from: 29.3, to: 32.6, text: "with a result that matches the math done by hand." },
  ],
  p5: [
    { from: 0.0, to: 6.2, text: "Friends and families across countries shouldn't need a bank or crypto knowledge to share costs." },
    { from: 6.7, to: 9.4, text: "Stressless trip with Tekosue." },
  ],
};
