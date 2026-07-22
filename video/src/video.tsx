import React from 'react';
import {
  AbsoluteFill,
  Img,
  interpolate,
  OffthreadVideo,
  Sequence,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';
import {Audio} from '@remotion/media';

const C = {
  paper: '#f7f5f0',
  surface: '#ffffff',
  ink: '#14192b',
  soft: '#5d6374',
  lapis: '#2b4acb',
  lapisDark: '#20379b',
  gold: '#c79114',
};

type Chapter = {
  from: number;
  to: number;
  eyebrow: string;
  title: string;
  caption: string;
  zoom: {x: number; y: number; scale: number};
};

const chapters: Chapter[] = [
  {from: 180, to: 750, eyebrow: 'THE METHOD', title: 'Seven deliberate moves', caption: 'A clear learning cycle keeps the learner doing the thinking.', zoom: {x: 0, y: 0, scale: 1.02}},
  {from: 750, to: 1470, eyebrow: 'INTERACTIVE LESSONS', title: 'Commit before reveal', caption: 'Deterministic code checks each real learning move.', zoom: {x: -2, y: -1, scale: 1.04}},
  {from: 1470, to: 2070, eyebrow: 'MAIA', title: 'Questions, never answers', caption: 'Step-aware guidance passes an answer-leak gate.', zoom: {x: -4, y: 0, scale: 1.06}},
  {from: 2070, to: 2760, eyebrow: 'SOURCE COURSE ARCHITECT', title: 'Start with a source you trust', caption: 'One Source Pack preserves rights, evidence, and provenance.', zoom: {x: 2, y: 1, scale: 1.045}},
  {from: 2760, to: 3240, eyebrow: 'EVIDENCE', title: 'Say what the result proves', caption: 'Independent transfer is recorded with honest limits.', zoom: {x: 1, y: 0, scale: 1.05}},
  {from: 3240, to: 3660, eyebrow: 'BUILT WITH CODEX + GPT-5.6', title: 'Models propose. Gates decide.', caption: 'Luna extracts. Terra teaches. Sol audits.', zoom: {x: -2, y: 0, scale: 1.055}},
];

const Brand: React.FC<{inverse?: boolean}> = ({inverse = false}) => (
  <div style={{display: 'flex', alignItems: 'center', gap: 18, color: inverse ? '#fff' : C.ink}}>
    <Img src={staticFile('brand/museion-mark.svg')} style={{width: 52, height: 52}} />
    <div style={{fontFamily: 'Georgia, serif', fontSize: 34, fontWeight: 700, letterSpacing: -1}}>Museion</div>
  </div>
);

const Hook: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const enter = spring({frame, fps, config: {damping: 18, stiffness: 110}});
  return (
    <AbsoluteFill style={{background: C.ink, color: '#fff', padding: 86, overflow: 'hidden'}}>
      <div style={{position: 'absolute', width: 720, height: 720, borderRadius: '50%', background: C.lapis, filter: 'blur(80px)', opacity: .28, right: -180, top: -260}} />
      <Brand inverse />
      <div style={{marginTop: 150, transform: `translateY(${interpolate(enter, [0, 1], [44, 0])}px)`, opacity: enter}}>
        <div style={{fontFamily: 'Arial, sans-serif', color: '#bfc9ff', fontSize: 24, fontWeight: 700, letterSpacing: 4}}>OPENAI BUILD WEEK · EDUCATION</div>
        <div style={{fontFamily: 'Georgia, serif', fontSize: 92, fontWeight: 700, letterSpacing: -4, lineHeight: 1.02, maxWidth: 1350, marginTop: 32}}>
          AI can give the answer.<br/><span style={{color: '#d8a82c'}}>Museion protects the thinking.</span>
        </div>
      </div>
    </AbsoluteFill>
  );
};

const Demo: React.FC = () => {
  const frame = useCurrentFrame();
  const chapter = chapters.find((item) => frame + 180 >= item.from && frame + 180 < item.to) ?? chapters[0];
  const local = frame + 180 - chapter.from;
  const fade = interpolate(local, [0, 10, Math.max(11, chapter.to - chapter.from - 16), Math.max(12, chapter.to - chapter.from)], [0, 1, 1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  return (
    <AbsoluteFill style={{background: 'linear-gradient(135deg, #edf1ff 0%, #f7f5f0 48%, #fff7df 100%)', padding: '56px 68px 70px'}}>
      <div style={{display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 30}}>
        <Brand />
        <div style={{fontFamily: 'Arial, sans-serif', fontSize: 20, fontWeight: 700, letterSpacing: 2.5, color: C.lapisDark}}>LEARN BY REASONING, NOT BY BEING TOLD.</div>
      </div>
      <div style={{position: 'relative', flex: 1, height: 830, borderRadius: 32, overflow: 'hidden', background: C.surface, boxShadow: '0 28px 80px rgba(20,25,43,.18)', border: '1px solid rgba(20,25,43,.08)'}}>
        <div style={{height: 46, display: 'flex', alignItems: 'center', gap: 10, padding: '0 20px', background: '#f7f7f8', borderBottom: '1px solid rgba(20,25,43,.08)'}}>
          {['#ef6a5b','#edbd4d','#61c454'].map((color) => <span key={color} style={{width: 13, height: 13, borderRadius: '50%', background: color}} />)}
          <div style={{marginLeft: 18, color: '#8a90a0', fontFamily: 'Arial, sans-serif', fontSize: 15}}>museion-beta.vercel.app</div>
        </div>
        <div style={{position: 'absolute', left: 0, right: 0, top: 46, bottom: 0, overflow: 'hidden'}}>
          <OffthreadVideo
            src={staticFile('source/museion1-720-keyframes.mp4')}
            muted
            style={{width: '105%', height: '100%', objectFit: 'cover', objectPosition: 'left center', transformOrigin: 'left center', transform: `translate(${chapter.zoom.x}%, ${chapter.zoom.y}%) scale(${chapter.zoom.scale})`}}
          />
        </div>
        <div style={{position: 'absolute', left: 28, top: 74, padding: '16px 20px', borderRadius: 18, background: 'rgba(20,25,43,.92)', color: '#fff', opacity: fade, maxWidth: 620, boxShadow: '0 12px 34px rgba(20,25,43,.24)'}}>
          <div style={{fontFamily: 'Arial, sans-serif', color: '#bbc7ff', fontWeight: 800, fontSize: 15, letterSpacing: 2.3}}>{chapter.eyebrow}</div>
          <div style={{fontFamily: 'Georgia, serif', fontWeight: 700, fontSize: 34, letterSpacing: -1, marginTop: 7}}>{chapter.title}</div>
        </div>
        <div style={{position: 'absolute', left: '50%', bottom: 24, transform: 'translateX(-50%)', width: 'min(1160px, 78%)', padding: '17px 28px', borderRadius: 20, background: 'rgba(20,25,43,.94)', color: '#fff', textAlign: 'center', fontFamily: 'Arial, sans-serif', fontSize: 27, fontWeight: 650, lineHeight: 1.25, opacity: fade, boxShadow: '0 14px 40px rgba(20,25,43,.28)'}}>
          {chapter.caption}
        </div>
      </div>
    </AbsoluteFill>
  );
};

const EndCard: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const enter = spring({frame, fps, config: {damping: 18, stiffness: 90}});
  return (
    <AbsoluteFill style={{background: C.paper, color: C.ink, alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: 90}}>
      <div style={{transform: `scale(${interpolate(enter, [0, 1], [.94, 1])})`, opacity: enter}}>
        <Img src={staticFile('brand/museion-mark.svg')} style={{width: 96, height: 96}} />
        <div style={{fontFamily: 'Georgia, serif', fontSize: 76, fontWeight: 700, letterSpacing: -3, marginTop: 24}}>Protect the thinking.</div>
        <div style={{fontFamily: 'Arial, sans-serif', color: C.soft, fontSize: 30, marginTop: 22}}>Live demo · Public code · No account or API key required</div>
        <div style={{display: 'inline-flex', gap: 14, marginTop: 52, padding: '18px 28px', borderRadius: 999, background: C.lapis, color: '#fff', fontFamily: 'Arial, sans-serif', fontSize: 24, fontWeight: 700}}>museion-beta.vercel.app/judge</div>
      </div>
    </AbsoluteFill>
  );
};

export const MuseionBuildWeek: React.FC<{voiceoverSrc: string | null}> = ({voiceoverSrc}) => (
  <AbsoluteFill>
    <Sequence from={0} durationInFrames={180}><Hook /></Sequence>
    <Sequence from={180} durationInFrames={3480}><Demo /></Sequence>
    <Sequence from={3660} durationInFrames={210}><EndCard /></Sequence>
    {voiceoverSrc ? <Audio src={staticFile(voiceoverSrc)} /> : null}
  </AbsoluteFill>
);
