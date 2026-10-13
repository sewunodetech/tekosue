import { fade } from "@remotion/transitions/fade";
import { linearTiming, TransitionSeries } from "@remotion/transitions";
import { Composition } from "remotion";
import { CLIPS, TITLE_CARD_SECONDS, TRANSITION_SECONDS } from "./config";
import { Phase1, Phase3, Phase5, TitleCard } from "./scenes/FootageScenes";
import { Phase2Pot } from "./scenes/Phase2Pot";
import { Phase4Goals } from "./scenes/Phase4Goals";
import { Thumbnail } from "./scenes/Thumbnail";
import { Ad, AD_SECONDS } from "./scenes/Ad";
import { POW_SECONDS, ProofOfWork } from "./scenes/ProofOfWork";
import { FPS, H, sec, W } from "./theme";

type Props = { captions: boolean };

const len = (c: { from: number; to: number }) => sec(c.to - c.from);

const SCENES = [
  { id: "P1-Problem", frames: len(CLIPS.p1), C: Phase1 },
  { id: "Title", frames: sec(TITLE_CARD_SECONDS), C: TitleCard },
  { id: "P2-WhatItIs", frames: len(CLIPS.p2), C: Phase2Pot },
  { id: "P3-Team", frames: len(CLIPS.p3), C: Phase3 },
  { id: "P4-Goals", frames: len(CLIPS.p4), C: Phase4Goals },
  { id: "P5-Tagline", frames: len(CLIPS.p5), C: Phase5 },
] as const;

const T = sec(TRANSITION_SECONDS);
const TOTAL = SCENES.reduce((n, s) => n + s.frames, 0) - T * (SCENES.length - 1);

export const Demo: React.FC<Props> = ({ captions }) => (
  <TransitionSeries>
    {SCENES.flatMap(({ id, frames, C }, i) => [
      ...(i > 0 ? [<TransitionSeries.Transition key={`${id}-in`} presentation={fade()} timing={linearTiming({ durationInFrames: T })} />] : []),
      <TransitionSeries.Sequence key={id} durationInFrames={frames}>
        <C captions={captions} />
      </TransitionSeries.Sequence>,
    ])}
  </TransitionSeries>
);

export const RemotionRoot: React.FC = () => (
  <>
    <Composition id="TekosueDemo" component={Demo} durationInFrames={TOTAL} fps={FPS} width={W} height={H} defaultProps={{ captions: true }} />
    <Composition id="TekosueAd30" component={Ad} durationInFrames={sec(AD_SECONDS)} fps={FPS} width={W} height={H} />
    <Composition id="ProofOfWork" component={ProofOfWork} durationInFrames={sec(POW_SECONDS)} fps={FPS} width={W} height={H} />
    <Composition id="Thumbnail" component={Thumbnail} durationInFrames={1} fps={FPS} width={W} height={H} />
    {SCENES.map(({ id, frames, C }) => (
      <Composition key={id} id={id} component={C} durationInFrames={frames} fps={FPS} width={W} height={H} defaultProps={{ captions: true }} />
    ))}
  </>
);
