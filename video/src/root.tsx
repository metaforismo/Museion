import React from 'react';
import {Composition} from 'remotion';
import {MuseionBuildWeek} from './video';

export const RemotionRoot: React.FC = () => (
  <Composition
    id="MuseionBuildWeek"
    component={MuseionBuildWeek}
    durationInFrames={4800}
    fps={30}
    width={1920}
    height={1080}
    defaultProps={{voiceoverSrc: null}}
  />
);
