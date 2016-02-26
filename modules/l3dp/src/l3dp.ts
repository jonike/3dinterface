export { SceneWithCoins } from './SceneWithCoins';
export { Coin } from './Coin';
export { ButtonManager } from './ButtonManager';
export { MountainScene } from './MountainScene';
export { BobombScene } from './BobombScene';
export { PeachScene } from './PeachScene';
export { SponzaScene } from './SponzaScene';
export { WhompScene } from './WhompScene';
export { CoinData } from './CoinData';
export { CoinCanvas } from './CoinCanvas';
export { logfps, resizeElements, show, hide, resetCameraAspect, appendTo } from './functions';
export { createSceneFromConfig } from './createFromConfig';
export { RecommendationData } from './RecommendationData';

// Avoid working on window if node
if (typeof window !== 'undefined') {
    window.containerSize = {
        width : () => { return 1134; },
        height: () => { return 768;  }
    }
}
