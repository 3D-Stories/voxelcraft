// src/player/CameraController.js
// First-person camera: sits at the player's eyes and follows yaw/pitch
// (docs/10-architecture.md, docs/00-master-prompt.md file tree).
// Called once per rendered frame with the interpolation alpha between ticks.

export class CameraController {
  constructor(camera, player) {
    if (!camera || !player) {
      throw new Error('CameraController requires a camera and a player');
    }
    this.camera = camera;
    this.player = player;
    this.camera.rotation.order = 'YXZ';
  }

  update(alpha = 1) {
    const player = this.player;
    const eye = player.getEyePosition(alpha);
    this.camera.position.copy(eye);
    this.camera.rotation.set(player.pitch, player.yaw, 0, 'YXZ');
  }
}
