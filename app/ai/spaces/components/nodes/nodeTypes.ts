import { TextPromptNode } from './TextPromptNode';
import { ImageUploadNode } from './ImageUploadNode';
import { ImageGenNode } from './ImageGenNode';
import { UpscaleNode } from './UpscaleNode';
import { BgRemoveNode } from './BgRemoveNode';
import { ProductNode } from './ProductNode';
import { AvatarNode } from './AvatarNode';
import { RestoreNode } from './RestoreNode';
import { ColorizeNode } from './ColorizeNode';
import { VideoGenNode } from './VideoGenNode';
import { MotionNode } from './MotionNode';
import { LipSyncNode } from './LipSyncNode';
import { VideoEffectsNode } from './VideoEffectsNode';
import { TTSNode } from './TTSNode';
import { OutputNode } from './OutputNode';
import { ImageToolNode } from './ImageToolNode';

export const nodeTypes = {
  textPrompt: TextPromptNode,
  imageUpload: ImageUploadNode,
  imageGen: ImageGenNode,
  nano: ImageGenNode,
  upscale: UpscaleNode,
  bgRemove: BgRemoveNode,
  product: ProductNode,
  avatar: AvatarNode,
  restore: RestoreNode,
  colorize: ColorizeNode,
  imageTool: ImageToolNode,
  videoGen: VideoGenNode,
  video: VideoGenNode,
  motion: MotionNode,
  lipsync: LipSyncNode,
  videoEffects: VideoEffectsNode,
  tts: TTSNode,
  output: OutputNode,
  outputMedia: OutputNode,
};
